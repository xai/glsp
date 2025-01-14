/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import * as sh from 'shelljs';
import { LOGGER } from '../../util/logger';
import {
    asMvnVersion,
    checkoutAndCd,
    commitAndTag,
    isExistingMavenVersion,
    lernaSetVersion,
    publish,
    ReleaseOptions,
    updateLernaForDryRun,
    updateServerConfig,
    updateVersion,
    yarnInstall
} from './common';

let REPO_ROOT: string;

export async function releaseTheiaIntegration(options: ReleaseOptions): Promise<void> {
    LOGGER.info('Prepare glsp-theia-integration release');
    LOGGER.debug('Release options: ', options);
    REPO_ROOT = checkoutAndCd(options);
    updateExternalGLSPDependencies(options.version);
    await updateDownloadServerScript(options.version);
    generateChangeLog();
    lernaSetVersion(REPO_ROOT, options.version);
    build();
    if (options.npmDryRun) {
        updateLernaForDryRun();
    }
    commitAndTag(options.version, REPO_ROOT);
    publish(REPO_ROOT, options);
}

function updateExternalGLSPDependencies(version: string): void {
    LOGGER.info('Update external GLSP dependencies (Client and workflow example)');
    sh.cd(REPO_ROOT);
    updateVersion({ name: '@eclipse-glsp/client', version }, { name: '@eclipse-glsp-examples/workflow-glsp', version });
}

async function updateDownloadServerScript(version: string): Promise<void> {
    LOGGER.info('Update example server download config');
    const mvnVersion = asMvnVersion(version);
    if (!isExistingMavenVersion('org.eclipse.glsp', 'org.eclipse.glsp.server', mvnVersion)) {
        LOGGER.warn(`No Java GLSP server with version ${mvnVersion} found on maven central!. Please release a new Java GLSP Server version
        before publishing this release!`);
    }

    sh.cd(`${REPO_ROOT}/examples/workflow-theia/src/node`);
    updateServerConfig('server-config.json', mvnVersion, false);
}

function build(): void {
    LOGGER.info('Install & Build with yarn');
    yarnInstall(REPO_ROOT);
    LOGGER.debug('Build successful');
}

function generateChangeLog(): void {
    // do nothing for now
}
