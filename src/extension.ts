// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sql-highlight" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('sql-highlight.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from sql-highlight!');
	});
	context.subscriptions.push(disposable);

	// 用于缓存token对应的DecorationType
	const decorationTypeCache = new Map<string, vscode.TextEditorDecorationType>();

	function getDecorationType(token: string): vscode.TextEditorDecorationType {
		if (decorationTypeCache.has(token)) {
			return decorationTypeCache.get(token)!;
		}
		// 简单hash算法
		let hash = 0;
		for (let i = 0; i < token.length; i++) {
			hash = token.charCodeAt(i) + ((hash << 5) - hash);
		}
		// 提取RGB各分量（确保值在0-255）
		const r = (hash & 0xFF0000) >> 16;
		const g = (hash & 0x00FF00) >> 8;
		const b = hash & 0x0000FF;
		const color = `rgb(${r % 256},${g % 256},${b % 256})`;
		// 增加白底
		const decType = vscode.window.createTextEditorDecorationType({
			color: color,
			backgroundColor: "#ffffff"
		});
		decorationTypeCache.set(token, decType);
		return decType;
	}

	function updateDecorations(editor: vscode.TextEditor) {
		if (!editor.document || editor.document.languageId !== 'sql') {
			return;
		}
		const regEx = /\bp\d+\b/g;
		const text = editor.document.getText();
		const decorationsMap = new Map<string, vscode.DecorationOptions[]>();
		let match;
		while ((match = regEx.exec(text))) {
			const startPos = editor.document.positionAt(match.index);
			const endPos = editor.document.positionAt(match.index + match[0].length);
			const range = new vscode.Range(startPos, endPos);
			const token = match[0];
			const deco = { range };
			if (!decorationsMap.has(token)) {
				decorationsMap.set(token, [deco]);
			} else {
				decorationsMap.get(token)!.push(deco);
			}
		}
		// 遍历每个token，设置对应装饰
		decorationsMap.forEach((decos, token) => {
			const decType = getDecorationType(token);
			editor.setDecorations(decType, decos);
		});
	}

	// 初始更新活跃SQL编辑器
	if (vscode.window.activeTextEditor) {
		updateDecorations(vscode.window.activeTextEditor);
	}

	// 当活跃编辑器变化时更新
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			updateDecorations(editor);
		}
	}));

	// 当文档内容变化时更新
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor && event.document === editor.document) {
			updateDecorations(editor);
		}
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}
