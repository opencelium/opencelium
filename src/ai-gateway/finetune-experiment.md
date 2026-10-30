# Fine-tuning experiment (2–3 days)

**Question:** can a LoRA-tuned `qwen2.5-coder:7b` build workflows as well as the stock `qwen2.5-coder:14b`, while answering
faster? If yes, the tuned 7B could replace the 14B for workflow building and remove the timeouts on large templates.

**Go / no-go:** on the held-out templates, the tuned 7B with templates **off** reaches at least the stock 14B's field and
placement scores with templates off, and has no more timeouts. Anything less → stop, and put the time into more templates and
better retrieval instead.

## Starting point (as of 2026-10-29)

- Machine: Apple M5, 24 GB. Ollama has `qwen2.5-coder:7b`, `qwen2.5-coder:14b` and `nomic-embed-text`.
- Python 3.15 is the system Python. MLX has no wheels for it yet, so use a separate 3.12 environment (step 0).
- Templates: 103 files in `src/backend/runtime/templates` (102 have a description). Only ~20 still match the current
  invokers (`MIN_CURRENT_SHARE` in `scripts/evalTemplates.ts`); the rest call operations that no longer exist.
- Baseline (stock 14B, `eval-results/final-20.json`, git-ignored), for the 15 templates where both modes finished:
  fields 57%/61% (recall/precision) with templates on vs 40%/43% off, placement 46% vs 33%. 6 timeouts on large i-doit workflows.
- **Missing piece:** nothing converts template JSON into our `WorkflowDsl`. `templateShape` in `src/eval/scoreWorkflow.ts` only
  extracts operations/placements/fields for scoring, and `parseTemplateFlow` (`src/examples/templateFlow.ts`) only extracts the
  outline. Writing that converter is most of day 1.
- `src/backend` is read-only for this work. Read the templates from there, but write everything under `src/ai-gateway`.

## Step 0 — environment (≈1 h)

```bash
brew install uv llama.cpp                    # llama.cpp: GGUF conversion and quantizing
cd src/ai-gateway && mkdir -p finetune && cd finetune
uv venv --python 3.12 && source .venv/bin/activate
uv pip install mlx-lm huggingface_hub
# MLX trains on Hugging Face weights, not on Ollama's GGUF file (~15 GB download):
huggingface-cli download Qwen/Qwen2.5-Coder-7B-Instruct --local-dir models/qwen2.5-coder-7b
```

Add `finetune/` to `src/ai-gateway/.gitignore` (models, data, adapters are large and generated).

## Day 1 — dataset

1. **Template → DSL converter** (`scripts/finetune/templateToDsl.ts`, reusing the walking logic of `templateShape`): methods,
   loops, ifs, request bodies with references, as `WorkflowDsl`. Check it by running each result through `validateWorkflow`
   and through `dslShape` → `scoreWorkflow` against `templateShape` of the same template. A correct conversion should score
   ~100% against itself.
2. **Keep only clean templates:** zero validation errors against the current invokers. Stale operations would teach the model
   names that no longer exist. **Early stop:** fewer than ~30 clean templates → too little to learn from; record the number and stop.
3. **Hold-out split**, fixed before any training and saved to `finetune/holdout.json`: 5 templates from the 15 in the baseline
   where both modes finished, including at least one large i-doit workflow (for the speed check). They never appear in training
   data, not even as fragments.
4. **Training pairs** (`scripts/finetune/buildDataset.ts`), written as MLX chat JSONL (`{"messages":[system, user, assistant]}`):
   - **The prompt must be exactly what the gateway sends.** Build it with the gateway's own prompt functions
     (`src/workflow/buildWorkflowPrompt.ts`, plan text from the template outline as in `scripts/evalTemplates.ts`), templates
     **off**. The answer is the converted DSL as JSON.
   - Stretching the data:
     - 3–5 reworded descriptions per template, generated with the 14B and skimmed by hand;
     - every loop and if body as its own small workflow ("use part of a template");
     - plan → workflow pairs (the template outline as plan text).
   - Shuffle; split into `train.jsonl` / `valid.jsonl` (90/10, by template, not by example).
   - Target: 800–2,000 pairs. Write the counts down.

## Day 2 — training

```bash
mlx_lm.lora --model models/qwen2.5-coder-7b --train --data data \
  --batch-size 1 --num-layers 16 --iters 1000 --learning-rate 1e-5 \
  --max-seq-length 8192 --grad-checkpoint --adapter-path adapters/run1
```

- Watch validation loss; stop or lower the learning rate if it rises while training loss falls (overfitting on ~50 templates
  is the main risk).
- If a long prompt runs out of memory: lower `--max-seq-length` to 6144 and drop the longest examples rather than truncating them.
- Quick check before converting anything: `mlx_lm.generate --adapter-path adapters/run1` on one held-out prompt. The answer
  must be valid DSL JSON.
- **Into Ollama:**
  ```bash
  mlx_lm.fuse --model models/qwen2.5-coder-7b --adapter-path adapters/run1 --save-path fused/run1 --dequantize
  python $(brew --prefix llama.cpp)/bin/convert_hf_to_gguf.py fused/run1 --outfile run1-f16.gguf   # path varies by version
  llama-quantize run1-f16.gguf run1-q4_k_m.gguf Q4_K_M
  ollama show qwen2.5-coder:7b --modelfile > Modelfile   # keeps the chat TEMPLATE and stop tokens identical
  # in Modelfile: replace the FROM line with  FROM ./run1-q4_k_m.gguf
  ollama create oc-workflow-7b:run1 -f Modelfile
  ```
- Budget for 2 runs (e.g. different `--iters` or learning rate). Name each Ollama model after its run.

## Day 3 — exam and decision

Run the exam on the 5 held-out templates only, with Ollama otherwise idle, one model at a time:

```bash
cd src/ai-gateway
IDS=$(node -e "console.log(require('./finetune/holdout.json').join(','))")
AI_WORKFLOW_MODEL=qwen2.5-coder:14b   node scripts/evalTemplates.ts --ids $IDS --templates off --out eval-results/ft-14b-off.jsonl
AI_WORKFLOW_MODEL=qwen2.5-coder:7b    node scripts/evalTemplates.ts --ids $IDS --templates off --out eval-results/ft-7b-off.jsonl
AI_WORKFLOW_MODEL=oc-workflow-7b:run1 node scripts/evalTemplates.ts --ids $IDS --templates off --out eval-results/ft-run1-off.jsonl
AI_WORKFLOW_MODEL=oc-workflow-7b:run1 node scripts/evalTemplates.ts --ids $IDS --templates on  --out eval-results/ft-run1-on.jsonl
```

- Check that `evalTemplates.ts` really reads `AI_WORKFLOW_MODEL` through `loadConfig` for both the plan and the build step.
  If the planner uses another model setting, set that too.
- Report one line per finished template (operations, placement, fields, errors, seconds), then a table:
  stock 14B / stock 7B / tuned 7B (off) / tuned 7B (on), with recall, precision, placement, errors, mean seconds, timeouts.
- The stock-7B row shows how much of the result comes from tuning and how much from the smaller model alone.
- Also check by hand: does the tuned model still follow instructions it wasn't trained on? Run one `/run/explain` and one
  `/condition/suggest` against it. A tuned model that only does workflows is fine, but then it must only be used for
  `AI_WORKFLOW_MODEL`, not `AI_HELP_MODEL`.

**Write-up:** the table, the go/no-go verdict against the criteria at the top, the dataset counts, and what would be needed for the
full version (more clean templates? retraining on every template change?). No gateway code change is needed to use the model,
only `AI_WORKFLOW_MODEL=oc-workflow-7b:runN`.

## Risks to keep in mind

- **Leakage:** a held-out template's description or fragment in the training data inflates the score. Split by template id first,
  then generate.
- **Prompt drift:** if the gateway's prompt changes after training, the tuned model sees prompts it was not trained on. Record the
  git commit used for the dataset.
- **Too few clean templates:** this is the most likely reason for an early stop, and it is a useful result on its own.
- **14B not tried:** QLoRA on the 14B might fit in 24 GB but would be slow. Only try it if the 7B result is close to passing.
