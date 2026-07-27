import { Command } from 'cmdk';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Card } from '@shared/ui/primitives/Card';
import { parseTokens } from '@shared/command/parser';
import { executeAST } from '@shared/command/executor';
import './сommandPalette.css';
import type {ASTNode} from "@shared/command/ast.ts";
import type {Suggestion} from "@shared/command/types.ts";
import {CommandPalettePortal} from "@widgets/CommandPalette/CommanPalettePortal.tsx";
import {Loading} from "@shared/ui/primitives/Loading/Loading.tsx";
import {Empty} from "@shared/ui/primitives/Empty";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {useCommandPaletteUIStore, type CommandRenderMode} from "@widgets/CommandPalette/command-palette.store.ts";
import {openModalStore} from "@app/layouts/AppLayout/GlobalModal/GlobalModal.tsx";
import {useModalStore} from "@app/layouts/AppLayout/GlobalModal/global-modal.store.ts";
import {useNavigate} from "react-router-dom";
import HotKey from "@widgets/CommandPalette/HotKey.tsx";
import {Icon} from "@shared/ui/primitives/Icon";
import {useConfirm} from "@shared/ui/confirm/ConfirmDialogContext.tsx";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";
import {useCommandPolicyContext} from "@shared/command/useCommandPolicyContext.ts";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {getRecentCommands, pushRecentCommand} from "@widgets/CommandPalette/recent.ts";
import {PaletteFooter} from "@widgets/CommandPalette/PaletteFooter.tsx";
import {buildTestId} from "@shared/testing/testId.ts";
import {orderGroups} from "@shared/command/groupOrder.ts";

type CommandPaletteProps = {
    /** Render as a compact icon + hotkey pill that animates open to the full
     * input on focus. Used where horizontal space is contested (workflow header). */
    collapsible?: boolean;
    /** Force a render mode for every command regardless of the user's UI setting.
     * The workflow editor passes 'modal' so commands open as dialogs over the
     * canvas instead of navigating away, opening a new tab, or rendering inline. */
    forceMode?: CommandRenderMode;
    /** Skip the recommendation tags on create/update wizard success screens.
     * The workflow editor sets this — its embedded palette's wizards shouldn't
     * surface links to unrelated top-level pages. */
    hideSuccessRecommendations?: boolean;
    /** Called whenever the palette resets its command context entirely — the
     * locked-scope pill (see lockAsChip) is explicitly unlocked via Backspace,
     * or the collapsible palette blurs/closes. The workflow editor uses this
     * to clear its search highlights once the user has left the command. */
    onScopeExit?: () => void;
    /** Called on Escape while no dialog is open, before the default
     * deactivate/blur behavior. Return true to consume the press (e.g. "some
     * transient state was cleared") so the palette stays open on this press —
     * the workflow editor uses this to make a first Escape clear search
     * highlights, and only a second Escape close the palette. */
    onEscapeClearScope?: () => boolean;
};

export const CommandPalette = ({ collapsible = false, forceMode, hideSuccessRecommendations, onScopeExit, onEscapeClearScope }: CommandPaletteProps = {}) => {
    const {isMobile} = useBreakpoints();
    const { showCommandContent, toggleCommandContent } = useLayoutStore();
    const {t: tCommon} = useI18n('common');
    const navigate = useNavigate();

    const confirmAction = useConfirm();
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [content, setContent] = useState<React.ReactNode>(null);
    const [contentKey, setContentKey] = useState(0);

    const [isActive, setIsActive] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [recent, setRecent] = useState<string[]>(() => getRecentCommands());
    const [highlighted, setHighlighted] = useState<string>('');
    // A literal command with `lockAsChip` locks here on selection — rendered
    // as a readonly pill before the caret, and implicitly prepended as the
    // first token to every subsequent parse until Backspace-on-empty clears it.
    const [lockedScope, setLockedScope] = useState<Suggestion | null>(null);
    const requestIdRef = useRef(0);
    const changeSourceRef = useRef<'input' | 'select'>('input');
    const policyContext = useCommandPolicyContext();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const buildTokens = (raw: string): string[] => {
        const base = raw.trim().length === 0 ? [] : raw.trim().split(/\s+/);
        return lockedScope ? [lockedScope.value, ...base] : base;
    };
    const executeWithContext = async (ast: ASTNode[]) => {
        const last = ast[ast.length - 1];
        if (last?.node.execute) {
            const next = pushRecentCommand(buildTokens(value).join(' '));
            setRecent(next);
        }
        await executeAST(ast, {
            setLoading: (loading) => setIsLoading(loading),
            hideRecommendations: hideSuccessRecommendations,
            render: (node) => {
                // When a mode is forced to 'modal', commands that hard-code inline
                // rendering (ignoring the store mode) must still open as a dialog.
                if (forceMode === 'modal') {
                    openModalStore(node);
                    return;
                }
                setContentKey(prev => prev + 1);
                setContent(node);
            },
            openModal: (node, options) => {
                openModalStore(node, options);
            },
            navigate: (url) => {
                navigate(url);
            },
            openNewTab: (url) => {
                window.open(url, '_blank');
            },

            confirm: async (options) => {
                return await confirmAction(
                    typeof options === 'string' ? { message: options } : options,
                );
            },

            setInputValue: (v: string) => setValue(v),
            focusInput: () => inputRef.current?.focus(),
        });
    };
    useEffect(() => {
        if (!showCommandContent && content !== null) {
            setContent(null);
        }
    }, [showCommandContent]);
    useEffect(() => {
        if (content !== null) {
            toggleCommandContent(true);
        }
    }, [content]);
    useEffect(() => {
        const source = changeSourceRef.current;
        // Reset immediately (not after execution) so a re-render triggered
        // while `execute` is still running — e.g. a confirm dialog stealing
        // focus, which blurs/refocuses the input and flips `isActive` — can't
        // be mistaken for a fresh selection and replay the same command.
        changeSourceRef.current = 'input';
        (async () => {
            try {
                setIsLoading(true);
                const id = ++requestIdRef.current;

                const tokens = buildTokens(value);
                const {suggestions, ast: newAst} = await parseTokens(tokens, policyContext);

                if (id === requestIdRef.current) {

                    if (source === 'select') {
                        await executeWithContext(newAst);
                    }
                    setSuggestions(suggestions);
                    setIsLoading(false);
                }
            } catch (e: unknown) {
                console.error(e);
                setIsLoading(false);
            }
        })()
        // `isActive` is included so the suggestion list is always recomputed
        // fresh the moment the palette is opened/focused — commands can be
        // gated on state outside this widget (e.g. the workflow editor's
        // command-palette bridge, only registered once its own mount effects
        // settle), so a value computed once at CommandPalette's own mount
        // could go stale. By the time a user can actually focus/open the
        // palette, any such external state has long since settled.
    }, [value, lockedScope, isActive]);
    // Kept current via ref (not a dep) so this window listener never needs to
    // re-subscribe just because the callback identity changed on re-render.
    const onEscapeClearScopeRef = useRef(onEscapeClearScope);
    useEffect(() => {
        onEscapeClearScopeRef.current = onEscapeClearScope;
    }, [onEscapeClearScope]);
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + K (Windows/Linux) or Cmd + K (Mac)
            if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
                // Capture phase + stopPropagation so we win the keystroke before a
                // focused editor/overlay can swallow it — otherwise preventDefault
                // never runs and Chrome's Ctrl+K omnibox shortcut takes over.
                e.preventDefault();
                e.stopPropagation();

                inputRef.current?.focus();
                setIsActive(true);
                return;
            }
            // A window-level listener (not the input's own onKeyDown) is required
            // here — the whole point is to clear transient scoped state (e.g. the
            // workflow editor's search highlights) even after focus has moved away
            // from the palette input onto the canvas, where the input's onKeyDown
            // would never see the keystroke at all. Capture phase so this runs
            // before the input's own Escape-to-blur handling; stopPropagation only
            // when consumed, so an unrelated Escape (nothing to clear) still
            // reaches the input/palette to blur/close as normal.
            if (e.key === 'Escape' && !useModalStore.getState().isOpen && onEscapeClearScopeRef.current?.()) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, []);

    // Apply this palette's forced render mode for as long as it is mounted, then
    // restore the user's preference on unmount.
    useEffect(() => {
        if (!forceMode) return;
        useCommandPaletteUIStore.getState().setModeOverride(forceMode);
        return () => useCommandPaletteUIStore.getState().setModeOverride(null);
    }, [forceMode]);

    const handleSelect = async (suggestion: Suggestion) => {
        changeSourceRef.current = 'select';

        if (suggestion.lockAsChip) {
            setLockedScope(suggestion);
            setValue('');
            return;
        }

        const rawTokens = value.trim().length === 0
            ? []
            : value.trim().split(/\s+/);

        const { ast } = await parseTokens(buildTokens(value), policyContext);

        const lastToken = rawTokens[rawTokens.length - 1];
        const lastAstNode = ast[ast.length - 1];

        const isExactLiteral =
            lastAstNode &&
            lastAstNode.node.type === 'literal' &&
            (
                lastAstNode.node.value === lastToken ||
                lastAstNode.node.aliases?.includes(lastToken)
            );

        const tokens = [...rawTokens];

        if (tokens.length === 0) {
            tokens.push(suggestion.value);
        } else if (isExactLiteral) {
            tokens.push(suggestion.value);
        } else {
            tokens[tokens.length - 1] = suggestion.value;
        }

        const newValue = tokens.join(' ') + ' ';
        setValue(newValue);
    };

    const handleSelectRecent = (recentValue: string) => {
        changeSourceRef.current = 'select';
        setLockedScope(null);
        setValue(recentValue + ' ');
    };

    const displayGroups = useMemo(() => {
        const groups = new Map<string, Suggestion[]>();
        // Recent commands are unrelated, standalone command strings — hide them
        // once a scope is locked so they don't compete with the scoped list.
        const isEmpty = value.trim().length === 0 && !lockedScope;
        if (isEmpty && recent.length > 0) {
            groups.set('recent', recent.map(r => ({ value: r, group: 'recent', icon: 'history' as const })));
        }
        suggestions.forEach(s => {
            const key = s.group ?? 'general';
            const arr = groups.get(key) ?? [];
            arr.push(s);
            groups.set(key, arr);
        });
        groups.forEach(arr => arr.sort((a, b) => a.value.localeCompare(b.value)));
        return orderGroups(Array.from(groups.keys())).map(key => ({
            key,
            heading: tCommon(`commandPalette.groups.${key}` as never),
            items: groups.get(key)!,
        }));
    }, [suggestions, recent, value, lockedScope, tCommon]);

    const hasItems = displayGroups.some(g => g.items.length > 0);

    // Collapsed only while idle: focus, typed text, or a locked scope (e.g. the
    // workflow search pill) expands it — a locked scope must stay visible even
    // after clicking away, so its search state isn't lost from view.
    const isCollapsed = collapsible && !isActive && value.trim().length === 0 && !lockedScope;

    return (
        <div className={`cmdk-palette-container${collapsible ? ' cmdk-collapsible' : ''}${isCollapsed ? ' cmdk-collapsed' : ''}`}>
            <div
                className="cmdk-container"
                style={{justifyContent: collapsible ? 'flex-start' : isMobile ? 'left' : 'center'}}
                onMouseDown={isCollapsed ? (e) => { e.preventDefault(); inputRef.current?.focus(); setIsActive(true); } : undefined}
            >
                <Command shouldFilter={false} value={highlighted} onValueChange={setHighlighted} style={{position: 'relative', paddingLeft: 20, paddingRight: 80}}>
                    <div className="cmdk-input-row">
                        {lockedScope && (
                            <span className="cmdk-scope-chip" data-testid="command-palette-scope-chip">
                                <span>{lockedScope.value}</span>
                            </span>
                        )}
                        <Command.Input
                            ref={inputRef}
                            data-testid="command-palette-input"
                            onFocus={() => setIsActive(true)}
                            onBlur={() => {
                                // Switching browser tabs/windows blurs the input too; ignore
                                // it so the typed value and open state survive returning.
                                if (!document.hasFocus()) return;
                                setIsActive(false);
                                // Clicking away should close the collapsible pill even with
                                // typed text — clear it so it collapses back to icon + hotkey.
                                // But a command opening a modal also blurs the input: keep the
                                // value (and the expanded pill) so it's intact when the modal
                                // closes and focus returns. Same for a locked scope (e.g. the
                                // workflow search pill) — clicking away to look at its results
                                // (the highlighted canvas) must not wipe out the search; only an
                                // explicit Backspace-unlock or a second Escape should do that.
                                if (collapsible && !useModalStore.getState().isOpen && !lockedScope) {
                                    changeSourceRef.current = 'input';
                                    setValue('');
                                    setLockedScope(null);
                                    onScopeExit?.();
                                }
                            }}
                            value={value}
                            onValueChange={(v) => {
                                changeSourceRef.current = 'input';
                                setValue(v);
                                setIsActive(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    // The window-level listener above handles clearing scoped
                                    // state first (capture phase, stopPropagation when consumed)
                                    // — reaching here means there was nothing to clear, so this
                                    // press just does the normal deactivate/blur.
                                    e.preventDefault();
                                    setIsActive(false);
                                    inputRef.current?.blur();
                                    return;
                                }
                                if (e.key === 'Backspace' && value === '' && lockedScope) {
                                    e.preventDefault();
                                    setLockedScope(null);
                                    onScopeExit?.();
                                    return;
                                }
                                if (e.key === 'Tab') {
                                    const all = displayGroups.flatMap(g => g.items).filter(s => !s.disabled);
                                    const fromHighlight = all.find(
                                        s => `${s.group ?? 'general'}:${s.value}` === highlighted,
                                    );
                                    const target = fromHighlight ?? all[0];
                                    if (target) {
                                        e.preventDefault(); // 🚨 important — otherwise focus will be lost
                                        if (target.group === 'recent') handleSelectRecent(target.value);
                                        else handleSelect(target);
                                    }
                                }
                            }}
                            placeholder={tCommon('commandPalette.placeholder')}
                        />
                        <div className="cmdk-loading">
                            {isLoading ? (
                                <div style={{marginLeft: 1, marginTop: 2}}><Loading size={'sm'}/></div>
                            ) : <Icon isSubtle name={'command'}/>}
                        </div>
                    </div>
                    <HotKey/>

                    {isActive && !isLoading && (hasItems || value.trim().length > 0) &&
                        <div className="cmdk-dropdown">
                            {hasItems ? (
                                <Command.List>
                                    {displayGroups.map(group => group.items.length > 0 && (
                                        <Command.Group key={group.key} heading={group.heading}>
                                            {group.items.map((s) => (
                                                <Command.Item
                                                    key={`${group.key}:${s.value}`}
                                                    value={`${group.key}:${s.value}`}
                                                    disabled={s.disabled}
                                                    data-testid={buildTestId('command-palette-item', group.key, s.value)}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onSelect={() => !s.disabled && (group.key === 'recent' ? handleSelectRecent(s.value) : handleSelect(s))}
                                                >
                                                    <div className="cmdk-item-row">
                                                        {s.icon && (
                                                            <span className="cmdk-item-icon">
                                                                <Icon name={s.icon} size={16}/>
                                                            </span>
                                                        )}
                                                        <span className="cmdk-item-value" title={s.label ?? s.value}>{s.label ?? s.value}</span>
                                                        {s.description && (
                                                            <span className="cmdk-item-description">
                                                                {tCommon(s.description as never)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Command.Item>
                                            ))}
                                        </Command.Group>
                                    ))}
                                </Command.List>
                            ) : (
                                <div className="cmdk-empty" data-testid="command-palette-empty">
                                    <Empty description={tCommon('commandPalette.noResults')} />
                                </div>
                            )}
                            <PaletteFooter/>
                        </div>
                    }
                </Command>
            </div>

            {content &&
                <CommandPalettePortal>
                    <div className="cmdk-content" style={{margin: '20px'}}>
                        <div style={{width: '100%', position: 'relative'}}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={contentKey}
                                    initial={{
                                        opacity: 0,
                                        y: 40,
                                        scale: 0.96,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: 30,
                                        scale: 0.95,
                                    }}
                                    transition={{
                                        duration: 0.45,
                                        ease: [0.22, 1, 0.36, 1], // "liquid" easing
                                        rotate: {
                                            duration: 0.6,
                                            ease: "easeInOut"
                                        }
                                    }}
                                    style={{ originX: 0.5, originY: 0.5 }}
                                >
                                    <Card>{content}</Card>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </CommandPalettePortal>
            }

        </div>
    );
};
