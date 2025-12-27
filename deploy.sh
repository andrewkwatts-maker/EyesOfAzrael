#!/bin/bash

###############################################################################
# deploy.sh - One-command deployment for Eyes of Azrael
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV="${1:-production}"  # production or staging
SKIP_TESTS="${2:-false}"
BACKUP_DIR="deploy-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${MAGENTA}╔════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║   Eyes of Azrael - Deploy to Firebase ║${NC}"
echo -e "${MAGENTA}╔════════════════════════════════════════╗${NC}\n"

echo -e "${BLUE}Environment: ${DEPLOY_ENV}${NC}"
echo -e "${BLUE}Timestamp: $(date)${NC}\n"

###############################################################################
# 1. Pre-deployment Checks
###############################################################################

echo -e "${YELLOW}[1/10] Pre-deployment checks...${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed${NC}"
    echo -e "${YELLOW}Install with: npm install -g firebase-tools${NC}"
    exit 1
fi

# Check if logged into Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}Error: Not logged into Firebase${NC}"
    echo -e "${YELLOW}Login with: firebase login${NC}"
    exit 1
fi

# Check if git repository is clean
if [[ -n $(git status -s 2>/dev/null) ]]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$DEPLOY_ENV" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}Warning: Deploying to production from branch '$CURRENT_BRANCH' (not 'main')${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}Pre-deployment checks passed${NC}\n"

###############################################################################
# 2. Create Backup
###############################################################################

echo -e "${YELLOW}[2/10] Creating backup...${NC}"

mkdir -p "$BACKUP_DIR"

# Backup critical files
cp -r data "$BACKUP_DIR/" 2>/dev/null || true
cp -r FIREBASE "$BACKUP_DIR/" 2>/dev/null || true
cp firebase.json "$BACKUP_DIR/" 2>/dev/null || true
cp firestore.rules "$BACKUP_DIR/" 2>/dev/null || true
cp storage.rules "$BACKUP_DIR/" 2>/dev/null || true

# Save git info
git log -1 > "$BACKUP_DIR/git-commit.txt" 2>/dev/null || true
git status > "$BACKUP_DIR/git-status.txt" 2>/dev/null || true

echo -e "${GREEN}Backup created: $BACKUP_DIR${NC}\n"

###############################################################################
# 3. Run Tests (unless skipped)
###############################################################################

if [ "$SKIP_TESTS" != "true" ]; then
    echo -e "${YELLOW}[3/10] Running tests...${NC}"

    if [ -f "./test.sh" ]; then
        if bash ./test.sh; then
            echo -e "${GREEN}Tests passed${NC}\n"
        else
            echo -e "${RED}Tests failed - deployment aborted${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}No test.sh found - skipping tests${NC}\n"
    fi
else
    echo -e "${YELLOW}[3/10] Tests skipped${NC}\n"
fi

###############################################################################
# 4. Build for Production
###############################################################################

echo -e "${YELLOW}[4/10] Building for production...${NC}"

if [ -f "./build.sh" ]; then
    if bash ./build.sh; then
        echo -e "${GREEN}Build completed${NC}\n"
    else
        echo -e "${RED}Build failed - deployment aborted${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}No build.sh found - skipping build${NC}\n"
fi

###############################################################################
# 5. Generate Entity Indices
###############################################################################

echo -e "${YELLOW}[5/10] Generating entity indices...${NC}"

if npm run generate-indices --silent; then
    echo -e "${GREEN}Entity indices generated${NC}\n"
else
    echo -e "${RED}Failed to generate indices - deployment aborted${NC}"
    exit 1
fi

###############################################################################
# 6. Validate Firebase Configuration
###############################################################################

echo -e "${YELLOW}[6/10] Validating Firebase configuration...${NC}"

# Validate firebase.json
if [ -f "firebase.json" ]; then
    if python3 -m json.tool "firebase.json" > /dev/null 2>&1 || node -e "require('./firebase.json')" > /dev/null 2>&1; then
        echo -e "${GREEN}firebase.json is valid${NC}\n"
    else
        echo -e "${RED}firebase.json is invalid - deployment aborted${NC}"
        exit 1
    fi
else
    echo -e "${RED}firebase.json not found - deployment aborted${NC}"
    exit 1
fi

###############################################################################
# 7. Deploy Firebase Rules
###############################################################################

echo -e "${YELLOW}[7/10] Deploying Firebase rules...${NC}"

if firebase deploy --only firestore:rules,storage:rules; then
    echo -e "${GREEN}Firebase rules deployed${NC}\n"
else
    echo -e "${RED}Failed to deploy Firebase rules${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

###############################################################################
# 8. Deploy Firebase Functions (if they exist)
###############################################################################

echo -e "${YELLOW}[8/10] Deploying Firebase functions...${NC}"

if [ -d "FIREBASE/functions" ]; then
    if firebase deploy --only functions; then
        echo -e "${GREEN}Firebase functions deployed${NC}\n"
    else
        echo -e "${RED}Failed to deploy Firebase functions${NC}"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}No Firebase functions found - skipping${NC}\n"
fi

###############################################################################
# 9. Deploy to Firebase Hosting
###############################################################################

echo -e "${YELLOW}[9/10] Deploying to Firebase Hosting...${NC}"

if [ "$DEPLOY_ENV" = "staging" ]; then
    # Deploy to staging channel
    firebase hosting:channel:deploy staging --expires 7d
else
    # Deploy to production
    firebase deploy --only hosting
fi

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}Hosting deployment successful${NC}\n"
else
    echo -e "${RED}Hosting deployment failed${NC}\n"
    exit 1
fi

###############################################################################
# 10. Post-deployment Verification
###############################################################################

echo -e "${YELLOW}[10/10] Post-deployment verification...${NC}"

# Get deployment URL
if [ "$DEPLOY_ENV" = "staging" ]; then
    DEPLOY_URL=$(firebase hosting:channel:list | grep staging | awk '{print $3}' | head -1)
else
    DEPLOY_URL=$(firebase hosting:site:get 2>/dev/null || echo "https://your-project.web.app")
fi

echo -e "${GREEN}Deployment URL: ${DEPLOY_URL}${NC}"

# Create deployment record
DEPLOY_RECORD="deployment-log-$(date +%Y%m%d-%H%M%S).txt"
cat > "$DEPLOY_RECORD" << EOF
Eyes of Azrael - Deployment Record
===================================
Timestamp: $(date)
Environment: $DEPLOY_ENV
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')
Git Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')
Deploy URL: $DEPLOY_URL
Backup Location: $BACKUP_DIR
Deployed By: $(git config user.name 2>/dev/null || echo 'Unknown')
Status: SUCCESS
EOF

echo -e "${GREEN}Deployment record saved: $DEPLOY_RECORD${NC}\n"

###############################################################################
# Success Summary
###############################################################################

echo -e "${MAGENTA}╔════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║      Deployment Successful! 🚀         ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Deployment Details:${NC}"
echo -e "  Environment: ${GREEN}$DEPLOY_ENV${NC}"
echo -e "  URL: ${GREEN}$DEPLOY_URL${NC}"
echo -e "  Backup: ${GREEN}$BACKUP_DIR${NC}"
echo -e "  Time: ${GREEN}$(date)${NC}"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Verify deployment: ${YELLOW}$DEPLOY_URL${NC}"
echo -e "  2. Run smoke tests: ${YELLOW}./smoke-test.sh $DEPLOY_URL${NC}"
echo -e "  3. Check monitoring: ${YELLOW}Firebase Console${NC}"
echo -e "  4. If issues: ${YELLOW}./rollback.sh${NC}"
echo ""

# Open URL in browser (optional)
read -p "Open deployment URL in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "$DEPLOY_URL"
    elif command -v open &> /dev/null; then
        open "$DEPLOY_URL"
    elif command -v start &> /dev/null; then
        start "$DEPLOY_URL"
    else
        echo -e "${YELLOW}Could not open browser automatically${NC}"
    fi
fi

exit 0
