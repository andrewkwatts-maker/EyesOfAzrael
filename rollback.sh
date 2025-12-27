#!/bin/bash

###############################################################################
# rollback.sh - Emergency rollback for Eyes of Azrael
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${RED}╔════════════════════════════════════════╗${NC}"
echo -e "${RED}║     Eyes of Azrael - ROLLBACK         ║${NC}"
echo -e "${RED}╚════════════════════════════════════════╝${NC}\n"

###############################################################################
# 1. Confirmation
###############################################################################

echo -e "${YELLOW}This will rollback the last deployment.${NC}"
echo -e "${YELLOW}This action cannot be easily undone.${NC}\n"

read -p "Are you sure you want to rollback? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${GREEN}Rollback cancelled${NC}"
    exit 0
fi

###############################################################################
# 2. Check Firebase CLI
###############################################################################

echo -e "${YELLOW}[1/5] Checking Firebase CLI...${NC}"

if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed${NC}"
    exit 1
fi

if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}Error: Not logged into Firebase${NC}"
    echo -e "${YELLOW}Login with: firebase login${NC}"
    exit 1
fi

echo -e "${GREEN}Firebase CLI ready${NC}\n"

###############################################################################
# 3. List Recent Deployments
###############################################################################

echo -e "${YELLOW}[2/5] Fetching deployment history...${NC}"

# Get Firebase Hosting releases
firebase hosting:releases:list --limit=10

echo ""
read -p "Enter the release ID to rollback to (or press Enter for previous): " RELEASE_ID
echo ""

###############################################################################
# 4. Rollback Options
###############################################################################

echo -e "${YELLOW}[3/5] Rollback method:${NC}"
echo -e "  1. Rollback Firebase Hosting to previous release"
echo -e "  2. Restore from local backup"
echo -e "  3. Deploy from specific git commit"
echo ""
read -p "Choose option (1-3): " -n 1 -r ROLLBACK_METHOD
echo ""
echo ""

###############################################################################
# 5. Execute Rollback
###############################################################################

echo -e "${YELLOW}[4/5] Executing rollback...${NC}"

case $ROLLBACK_METHOD in
    1)
        # Rollback to previous Firebase Hosting release
        echo -e "${YELLOW}Rolling back Firebase Hosting...${NC}"

        if [ -z "$RELEASE_ID" ]; then
            # Rollback to previous release
            firebase hosting:clone --previous
        else
            # Rollback to specific release
            firebase hosting:clone "$RELEASE_ID"
        fi

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Firebase Hosting rollback successful${NC}\n"
        else
            echo -e "${RED}Firebase Hosting rollback failed${NC}\n"
            exit 1
        fi
        ;;

    2)
        # Restore from local backup
        echo -e "${YELLOW}Available backups:${NC}"
        ls -lt deploy-backup-* 2>/dev/null | head -10

        echo ""
        read -p "Enter backup directory name: " BACKUP_DIR

        if [ ! -d "$BACKUP_DIR" ]; then
            echo -e "${RED}Backup directory not found: $BACKUP_DIR${NC}"
            exit 1
        fi

        echo -e "${YELLOW}Restoring from backup: $BACKUP_DIR${NC}"

        # Restore data
        if [ -d "$BACKUP_DIR/data" ]; then
            cp -r "$BACKUP_DIR/data" ./
            echo -e "${GREEN}Data restored${NC}"
        fi

        # Restore FIREBASE
        if [ -d "$BACKUP_DIR/FIREBASE" ]; then
            cp -r "$BACKUP_DIR/FIREBASE" ./
            echo -e "${GREEN}Firebase assets restored${NC}"
        fi

        # Restore configuration files
        if [ -f "$BACKUP_DIR/firebase.json" ]; then
            cp "$BACKUP_DIR/firebase.json" ./
            echo -e "${GREEN}firebase.json restored${NC}"
        fi

        if [ -f "$BACKUP_DIR/firestore.rules" ]; then
            cp "$BACKUP_DIR/firestore.rules" ./
            echo -e "${GREEN}firestore.rules restored${NC}"
        fi

        if [ -f "$BACKUP_DIR/storage.rules" ]; then
            cp "$BACKUP_DIR/storage.rules" ./
            echo -e "${GREEN}storage.rules restored${NC}"
        fi

        # Redeploy with restored files
        echo -e "${YELLOW}Redeploying with restored files...${NC}"
        firebase deploy --only hosting,firestore:rules,storage:rules

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Backup restoration and redeployment successful${NC}\n"
        else
            echo -e "${RED}Redeployment failed${NC}\n"
            exit 1
        fi
        ;;

    3)
        # Deploy from specific git commit
        echo -e "${YELLOW}Recent commits:${NC}"
        git log --oneline -10

        echo ""
        read -p "Enter git commit hash: " COMMIT_HASH

        if [ -z "$COMMIT_HASH" ]; then
            echo -e "${RED}No commit hash provided${NC}"
            exit 1
        fi

        # Verify commit exists
        if ! git cat-file -e "$COMMIT_HASH" 2>/dev/null; then
            echo -e "${RED}Commit not found: $COMMIT_HASH${NC}"
            exit 1
        fi

        # Create rollback branch
        ROLLBACK_BRANCH="rollback-$(date +%Y%m%d-%H%M%S)"
        echo -e "${YELLOW}Creating rollback branch: $ROLLBACK_BRANCH${NC}"

        git checkout -b "$ROLLBACK_BRANCH" "$COMMIT_HASH"

        # Build and deploy
        echo -e "${YELLOW}Building from commit $COMMIT_HASH...${NC}"
        if [ -f "./build.sh" ]; then
            bash ./build.sh
        fi

        echo -e "${YELLOW}Deploying from commit $COMMIT_HASH...${NC}"
        firebase deploy --only hosting,firestore:rules,storage:rules

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Git-based rollback successful${NC}\n"
            echo -e "${YELLOW}You are now on branch: $ROLLBACK_BRANCH${NC}"
            echo -e "${YELLOW}To return to main: git checkout main${NC}\n"
        else
            echo -e "${RED}Deployment failed${NC}\n"
            git checkout -
            exit 1
        fi
        ;;

    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

###############################################################################
# 6. Post-Rollback Actions
###############################################################################

echo -e "${YELLOW}[5/5] Post-rollback verification...${NC}"

# Create rollback record
ROLLBACK_RECORD="rollback-log-$(date +%Y%m%d-%H%M%S).txt"
cat > "$ROLLBACK_RECORD" << EOF
Eyes of Azrael - Rollback Record
==================================
Timestamp: $(date)
Method: $ROLLBACK_METHOD
Release ID: ${RELEASE_ID:-N/A}
Backup Dir: ${BACKUP_DIR:-N/A}
Git Commit: ${COMMIT_HASH:-N/A}
Current Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')
Performed By: $(git config user.name 2>/dev/null || echo 'Unknown')
Status: SUCCESS
EOF

echo -e "${GREEN}Rollback record saved: $ROLLBACK_RECORD${NC}\n"

###############################################################################
# Success Summary
###############################################################################

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Rollback Completed Successfully    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Rollback Details:${NC}"
echo -e "  Method: ${GREEN}$ROLLBACK_METHOD${NC}"
echo -e "  Time: ${GREEN}$(date)${NC}"
echo -e "  Record: ${GREEN}$ROLLBACK_RECORD${NC}"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Verify site is working: ${YELLOW}firebase hosting:site:get${NC}"
echo -e "  2. Test functionality thoroughly"
echo -e "  3. Monitor error logs in Firebase Console"
echo -e "  4. Document what went wrong"
echo -e "  5. Fix the issue before next deployment"
echo ""

echo -e "${YELLOW}Important:${NC}"
echo -e "  - Review what caused the need for rollback"
echo -e "  - Update tests to catch similar issues"
echo -e "  - Consider adding to pre-deployment checklist"
echo ""

exit 0
