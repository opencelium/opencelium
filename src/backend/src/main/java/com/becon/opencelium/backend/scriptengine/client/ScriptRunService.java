package com.becon.opencelium.backend.scriptengine.client;

import com.becon.opencelium.backend.resource.languages.ScriptExecutionRequest;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO;

/** Runs user-written enhancement scripts with test values, in a sandbox. */
public interface ScriptRunService {

  /**
   * Runs the given script with the given variable values.
   *
   * <p>The script cannot reach Java classes, load other code or stop the server, and is stopped
   * when it runs too long.
   *
   * @param request the language, source code and variable values
   * @return the outcome; a failing script is reported in the result, not thrown
   * @throws com.becon.opencelium.backend.exception.GeneralServiceException when the request is
   *     invalid (empty or too large script or variables, invalid variable name, unsupported
   *     language) or too many scripts are running
   */
  ScriptExecutionResultDTO run(ScriptExecutionRequest request);
}
