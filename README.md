# byulhook

**byulhook** is a tool for managing Git hooks.

![npm](https://img.shields.io/npm/v/byulhook)
![license](https://img.shields.io/npm/l/byulhook)

## Installation

You can install **byulhook** using your preferred package manager:

### npm

```bash
npm install byulhook
```

### Yarn

```bash
yarn add byulhook
```

### pnpm

```bash
pnpm add byulhook
```

### Bun

```bash
bun add byulhook
```
## Setup error
If the `byulhook.yml` file hasn’t been created, run:
```bash
node node_modules/byul-alias/dist/bin/setup.mjs
```
Or, you can manually create the `byulhook.yml` file and add this code:

```yaml
# hook name:
#   This is the name of the Git hook, such as 'pre-commit', 'commit-msg', etc.
#   commands:
#     command name:
#       A user-defined name for the command. This can be any descriptive name you choose.
#       run: 'command to run'
#       The shell command or script that will be executed when the hook is triggered.
#
# Example:
#
# pre-commit:
#   commands:
#     lint:
#       run: 'npm run lint'
```
## Usage

### Define Your Git Hooks

Customize your Git hooks by editing the `byulhook.yml` file. Here’s an example configuration:

```yaml
pre-commit:
  commands:
    Lint:
      run: "npm run lint"
    Prettier:
      run: "npm run prettier -- --write '**/*.{js,jsx,ts,tsx,css,md}'"
```

This setup will automatically run linting and formatting to ensure code consistency across your project.

### Install and Apply Hooks

Once your hooks are configured, install and apply them effortlessly with:

```bash
npx byulhook install
npx byulhook add
```

ByulHook automatically finds the right directory for your hooks and applies them with no extra effort.

## Why Choose ByulHook?

- **Setup:** ByulHook features a straightforward installation process.
- **Speed:** ByulHook operates at lightning-fast speeds, keeping your development workflow smooth and allowing you to focus on writing important code.
- **Convenience:** ByulHook’s simple design makes managing Git hooks easy, even for beginners.
- **Compatibility:** ByulHook works seamlessly across various environments and Git workflows, integrating effortlessly into your existing setup.
- **Logs:** ByulHook provides easy-to-read logs, making it simple to understand what’s happening and troubleshoot when needed

## Contributing

We welcome contributions to **byulhook**! Whether it's reporting a bug, suggesting an enhancement, or submitting a pull request, your input is valued.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions, suggestions, or feedback, please contact [love1ace](mailto:lovelacedud@gmail.com).
