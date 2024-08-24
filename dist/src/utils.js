import * as fs from 'fs';
import * as path from 'path';
export function getHooksPath() {
    const gitConfigPath = path.resolve(process.cwd(), '.git/config');
    if (fs.existsSync(gitConfigPath)) {
        const configContent = fs.readFileSync(gitConfigPath, 'utf8');
        const match = configContent.match(/core\.hooksPath\s*=\s*(.+)/);
        if (match && match[1]) {
            return path.resolve(process.cwd(), match[1].trim());
        }
    }
    return path.resolve(process.cwd(), '.git/hooks');
}
