package com.becon.opencelium.backend.scriptengine.client;

import com.becon.opencelium.backend.resource.languages.ScriptValidationRequest;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO;

/** Checks the syntax of user-written enhancement scripts without executing them. */
public interface ScriptValidationService {

  /**
   * Checks the syntax of the given script.
   *
   * <p>The script is only compiled, never run, so runtime errors (for example calling a member
   * of an undefined variable) are not reported.
   *
   * @param request the language and source code to check
   * @return the outcome; an invalid script is reported in the result, not thrown
   * @throws com.becon.opencelium.backend.exception.GeneralServiceException when the script is
   *     missing or too large, or the language cannot be checked
   */
  ScriptValidationResultDTO validate(ScriptValidationRequest request);
}
