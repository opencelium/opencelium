/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.invoker.service;

import java.util.List;

/**
 * Installs invoker files from the remote repository configured under
 * {@code opencelium.invoker-repository} into the runtime invoker folder.
 */
public interface InvokerRepositoryService {

    /**
     * Downloads every invoker xml file from the configured repository folder and stores each one
     * through the regular upload pipeline: an existing local file is fully overwritten, a new one
     * is added, and invokers that exist only locally are left untouched.
     *
     * <p>Files are processed independently — one rejected file (invalid xml, name shadowing
     * another local file) does not abort the batch; it is reported as a failure instead.
     *
     * @return the names of the installed invokers plus the files that could not be installed
     */
    DownloadResult downloadAll();

    /** Outcome of a bulk download: installed invoker names and per-file failures. */
    record DownloadResult(List<String> installed, List<FailedFile> failed) {
        public DownloadResult {
            installed = List.copyOf(installed);
            failed = List.copyOf(failed);
        }
    }

    /** A repository file that could not be installed, with the reason it was rejected. */
    record FailedFile(String fileName, String reason) {}
}
