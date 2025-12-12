# Setup Guide for Tarkov Search

This guide provides step-by-step instructions to set up and run the Tarkov Search project on your local machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Node.js Installation](#nodejs-installation)
- [Project Setup](#project-setup)
- [Environment Configuration](#environment-configuration)
- [Dependency Installation](#dependency-installation)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Getting Started](#getting-started)

---

## Prerequisites

Before you begin, ensure your system meets the following requirements:

- **Operating System**: Windows, macOS, or Linux
- **Memory**: At least 2GB RAM available
- **Disk Space**: At least 500MB free space
- **Internet Connection**: Required for downloading dependencies
- **Git**: For cloning the repository (optional, if downloading as ZIP)

---

## Node.js Installation

### Windows

1. Visit the [Node.js official website](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version
3. Run the installer (.msi file)
4. Follow the installation wizard, accepting default settings
5. Ensure "npm package manager" is selected
6. Complete the installation and restart your computer

### macOS

#### Using Homebrew (Recommended)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

#### Manual Installation

1. Visit the [Node.js official website](https://nodejs.org/)
2. Download the macOS installer (.pkg file) for LTS version
3. Run the installer and follow the prompts
4. Complete the installation

### Linux (Ubuntu/Debian)

```bash
# Update package manager
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

### Linux (Fedora/RHEL)

```bash
# Install Node.js and npm
sudo dnf install nodejs npm

# Verify installation
node --version
npm --version
```

---

## Project Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/isogloss/tarkov-search.git

# Navigate to the project directory
cd tarkov-search
```

### 2. Verify Node.js Installation

```bash
# Check Node.js version (should be v14.0.0 or higher)
node --version

# Check npm version (should be v6.0.0 or higher)
npm --version
```

---

## Environment Configuration

### 1. Create Environment File

Create a `.env` file in the root directory of the project:

```bash
# From the project root directory
cp .env.example .env
```

If `.env.example` doesn't exist, create `.env` manually:

```bash
touch .env
```

### 2. Configure Environment Variables

Edit the `.env` file and add the following variables (adjust values as needed):

```env
# Application Environment
NODE_ENV=development
PORT=3000

# API Configuration
API_BASE_URL=http://localhost:3000
API_TIMEOUT=5000

# Database Configuration (if applicable)
DATABASE_URL=

# Authentication (if applicable)
SECRET_KEY=your_secret_key_here

# Logging
LOG_LEVEL=info

# Feature Flags
DEBUG=false
```

**Note**: Update `secret_key_here` and other sensitive values with actual configuration appropriate for your environment.

### 3. Verify Environment Setup

```bash
# Verify that .env file exists in the root directory
ls -la | grep .env

# On Windows PowerShell
dir | findstr .env
```

---

## Dependency Installation

### Install npm Packages

```bash
# Navigate to project directory (if not already there)
cd tarkov-search

# Install all dependencies listed in package.json
npm install

# Alternative: Install with verbose output (helpful for debugging)
npm install --verbose
```

**Expected Output**: Installation should complete without critical errors. You may see warnings about optional dependencies, which are generally safe to ignore.

### Verify Dependencies

```bash
# List installed packages
npm list

# Check specific package versions
npm list [package-name]

# For example, check React version (if applicable)
npm list react
```

---

## Verification

### Run Health Check

```bash
# Start the development server
npm start

# Expected output:
# > tarkov-search@1.0.0 start
# > your-start-script
# Server running on http://localhost:3000
```

### Verify API Connectivity

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the application running without errors.

### Check Dependencies

```bash
# Audit npm packages for vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix
```

---

## Troubleshooting

### Issue: Node.js or npm Not Recognized

**Symptoms**: Command not found error when running `node --version`

**Solutions**:
1. Verify Node.js installation: Re-run the installer and ensure "Add to PATH" is selected
2. Restart your terminal/command prompt
3. Check PATH environment variable:
   ```bash
   # On macOS/Linux
   echo $PATH
   
   # On Windows PowerShell
   $env:Path
   ```
4. Reinstall Node.js if necessary

### Issue: npm install Fails

**Symptoms**: Errors during `npm install`

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# On Windows, use:
# rmdir /s /q node_modules
# del package-lock.json

# Reinstall dependencies
npm install
```

### Issue: Port Already in Use

**Symptoms**: Error "EADDRINUSE: address already in use :::3000"

**Solutions**:
```bash
# Find process using port 3000
# On macOS/Linux
lsof -i :3000

# On Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Kill the process
kill -9 <PID>

# Or change PORT in .env file
PORT=3001
```

### Issue: Environment Variables Not Loading

**Symptoms**: Undefined variables or connection errors

**Solutions**:
1. Verify `.env` file exists in project root:
   ```bash
   ls -la .env
   ```
2. Check file permissions:
   ```bash
   chmod 644 .env
   ```
3. Ensure .env is not in .gitignore (recommended for security)
4. Restart the development server after modifying .env

### Issue: Dependency Conflicts

**Symptoms**: Version conflict errors during `npm install`

**Solutions**:
```bash
# Use npm to install with legacy peer dependencies flag
npm install --legacy-peer-deps

# Or update npm to latest version
npm install -g npm@latest

# Then retry installation
npm install
```

### Issue: Module Not Found Errors

**Symptoms**: "Cannot find module" errors when running the application

**Solutions**:
```bash
# Verify node_modules directory exists
ls node_modules

# Reinstall dependencies
npm install

# Check for typos in import statements
# Verify package.json includes required dependencies
cat package.json
```

### Issue: Build/Compilation Errors

**Symptoms**: Errors during `npm run build` or `npm start`

**Solutions**:
```bash
# Check Node version compatibility
node --version

# Update Node.js to LTS version if outdated

# Clear build artifacts
rm -rf dist build .next

# Rebuild
npm run build

# Or start in development mode with more verbose output
npm start -- --verbose
```

### Issue: Git-Related Errors During Installation

**Symptoms**: "ENOENT: no such file or directory, open '.git/...'

**Solutions**:
```bash
# Initialize git repository if needed
git init

# Or ensure you cloned properly
git clone https://github.com/isogloss/tarkov-search.git

# Verify remote is set
git remote -v
```

### Getting Help

If issues persist:

1. Check the project's [GitHub Issues](https://github.com/isogloss/tarkov-search/issues)
2. Review npm error logs:
   ```bash
   cat ~/.npm/_logs/[latest-log-file]
   ```
3. Run diagnostics:
   ```bash
   npm doctor
   ```
4. Create a detailed bug report with:
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Operating system and version
   - Full error message
   - Steps to reproduce

---

## Getting Started

Once setup is complete, you can:

### Development Server

```bash
# Start development server with hot reload
npm start

# Server will be available at http://localhost:3000
```

### Building for Production

```bash
# Create production build
npm run build

# Output will be in ./dist or ./build directory
```

### Running Tests

```bash
# Run test suite
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Linting and Formatting

```bash
# Check code style
npm run lint

# Fix fixable linting issues
npm run lint -- --fix

# Format code (if Prettier is configured)
npm run format
```

---

## Additional Resources

- [Node.js Official Documentation](https://nodejs.org/docs/)
- [npm Official Documentation](https://docs.npmjs.com/)
- [Project Repository](https://github.com/isogloss/tarkov-search)
- [Common npm Issues](https://docs.npmjs.com/troubleshooting)

---

## Support

For questions or issues, please:
1. Check this setup guide thoroughly
2. Review project documentation
3. Check existing GitHub issues
4. Create a new GitHub issue with detailed information

---

**Last Updated**: 2025-12-12
**Version**: 1.0
