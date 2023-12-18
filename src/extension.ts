import * as vscode from 'vscode';
import {cd, exec, which} from 'shelljs';

// content of .lintstagedrc.js
const getLintstagedrc = (dtsFiles: string[] = []) => `module.exports = {
  '*.(ts|tsx)': 'eslint --cache --fix --max-warnings=0',
  '*.(ts|tsx)': 'npx tsc-files --noEmit ${dtsFiles.join(' ')}',
}`;

// get cmd line commands
// TODO: remove default npx test from husky
const getCmds = (dtsFiles: string[] = []) => [
	'npm i eslint lint-staged tsc-files -D',
	'npx husky-init',
	"npx husky add .husky/pre-commit 'npx lint-staged --no-stash'",
	'npm i',
	`echo "${getLintstagedrc(dtsFiles)}" > .lintstagedrc.js`,
];

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('setup-commit-hook.init', async () => {

		if (!which('git')) {
			vscode.window.showErrorMessage('The commit hook requires git');
		}

		// confirm root path
		const rootPath = await vscode.window.showInputBox({
			placeHolder: "/",
			prompt: "Confirm the path to the root folder",
			value: vscode.workspace.workspaceFolders?.[0].uri.path
		  });

		if (!rootPath) {
			vscode.window.showErrorMessage('Please enter a valid root path!');
			return;
		}

		cd(rootPath);
		
		// get list of files
		const dtsFiles = await vscode.window.showInputBox({
			placeHolder: "foo.d.ts, bar.d.ts",
			prompt: "Enter a comma separated list of d.ts files (optional)",
		  });

		vscode.window.showInformationMessage('Please wait while I install all the things…');

		const cmds = getCmds(dtsFiles?.split(',')).join(' && ');

		exec(cmds, (code, stdout, stderr) => {
			if (stderr) {
				vscode.window.showErrorMessage(`Error from terminal: ${stderr}`);
			}
			vscode.window.showInformationMessage(`It is done! ${code}`);
		});

		// const cp = require('child_process');
		// // @ts-ignore
		// cp.exec(getCmds(dtsFiles?.split(',')).join(' && '), (err, stdout, stderr) => {
		// 	if (err) {
		// 		vscode.window.showErrorMessage(`Error from terminal: ${err}`);
		// 	}
		// });
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}


