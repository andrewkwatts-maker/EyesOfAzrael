/**
 * Version Tracker - Eyes of Azrael
 *
 * Tracks data version in Firestore and manages cache invalidation
 * based on version changes. Automatically increments version on
 * data uploads.
 *
 * @module VersionTracker
 */

class VersionTracker {
  /**
   * Initialize the version tracker
   * @param {Object} firebaseApp - Firebase app instance
   * @param {Object} options - Configuration options
   */
  constructor(firebaseApp = null, options = {}) {
    this.db = firebaseApp ? firebase.firestore(firebaseApp) : null;
    this.options = {
      collection: options.collection || 'system',
      document: options.document || 'version',
      autoIncrement: options.autoIncrement !== false,
      checkInterval: options.checkInterval || 300000, // 5 minutes
      enableLogging: options.enableLogging || false,
      onVersionChange: options.onVersionChange || null
    };

    this.currentVersion = null;
    this.lastCheck = null;
    this.checkTimer = null;
    this.listeners = [];
  }

  /**
   * Initialize Firestore connection
   * @param {Object} firebaseApp - Firebase app instance
   */
  initFirestore(firebaseApp) {
    this.db = firebase.firestore(firebaseApp);
    this.log('Firestore initialized');
  }

  /**
   * Initialize version tracking
   * @returns {Promise<number>} Current version number
   */
  async initialize() {
    if (!this.db) {
      throw new Error('Firestore not initialized. Call initFirestore() first.');
    }

    try {
      // Get current version
      this.currentVersion = await this.getCurrentVersion();
      this.log(`Initialized with version: ${this.currentVersion}`);

      // Start periodic version checking
      this.startVersionChecking();

      return this.currentVersion;
    } catch (error) {
      this.log('Error initializing version tracker:', error);
      throw error;
    }
  }

  /**
   * Get current version from Firestore
   * @returns {Promise<number>} Current version number
   */
  async getCurrentVersion() {
    try {
      const docRef = this.db.collection(this.options.collection).doc(this.options.document);
      const doc = await docRef.get();

      if (doc.exists) {
        const data = doc.data();
        this.lastCheck = Date.now();
        return data.version || 1;
      } else {
        // Initialize version document if it doesn't exist
        await this.initializeVersionDocument();
        return 1;
      }
    } catch (error) {
      this.log('Error getting current version:', error);
      throw error;
    }
  }

  /**
   * Initialize version document in Firestore
   * @returns {Promise<void>}
   */
  async initializeVersionDocument() {
    try {
      const docRef = this.db.collection(this.options.collection).doc(this.options.document);
      await docRef.set({
        version: 1,
        created: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        updateCount: 0,
        metadata: {
          description: 'System version for cache invalidation',
          autoIncrement: this.options.autoIncrement
        }
      });
      this.log('Version document initialized');
    } catch (error) {
      this.log('Error initializing version document:', error);
      throw error;
    }
  }

  /**
   * Increment version (call after data upload)
   * @param {Object} metadata - Optional metadata about the update
   * @returns {Promise<number>} New version number
   */
  async incrementVersion(metadata = {}) {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const docRef = this.db.collection(this.options.collection).doc(this.options.document);

      // Use transaction to ensure atomic increment
      const newVersion = await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);

        let currentVersion = 1;
        let updateCount = 0;

        if (doc.exists) {
          const data = doc.data();
          currentVersion = data.version || 1;
          updateCount = data.updateCount || 0;
        }

        const newVersion = currentVersion + 1;

        transaction.set(docRef, {
          version: newVersion,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          updateCount: updateCount + 1,
          lastUpdate: {
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            metadata: metadata,
            previousVersion: currentVersion
          },
          metadata: {
            description: 'System version for cache invalidation',
            autoIncrement: this.options.autoIncrement
          }
        }, { merge: true });

        return newVersion;
      });

      this.currentVersion = newVersion;
      this.log(`Version incremented to: ${newVersion}`);

      // Notify listeners
      this.notifyVersionChange(newVersion);

      return newVersion;
    } catch (error) {
      this.log('Error incrementing version:', error);
      throw error;
    }
  }

  /**
   * Check for version changes
   * @returns {Promise<boolean>} Whether version has changed
   */
  async checkForUpdates() {
    if (!this.db) {
      return false;
    }

    try {
      const remoteVersion = await this.getCurrentVersion();

      if (this.currentVersion !== null && remoteVersion !== this.currentVersion) {
        this.log(`Version changed: ${this.currentVersion} -> ${remoteVersion}`);
        const oldVersion = this.currentVersion;
        this.currentVersion = remoteVersion;

        // Notify listeners
        this.notifyVersionChange(remoteVersion, oldVersion);

        return true;
      }

      return false;
    } catch (error) {
      this.log('Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Start periodic version checking
   */
  startVersionChecking() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.checkTimer = setInterval(async () => {
      const hasChanged = await this.checkForUpdates();
      if (hasChanged && this.options.onVersionChange) {
        this.options.onVersionChange(this.currentVersion);
      }
    }, this.options.checkInterval);

    this.log(`Version checking started (interval: ${this.options.checkInterval}ms)`);
  }

  /**
   * Stop periodic version checking
   */
  stopVersionChecking() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      this.log('Version checking stopped');
    }
  }

  /**
   * Add version change listener
   * @param {Function} callback - Callback function (newVersion, oldVersion)
   * @returns {Function} Unsubscribe function
   */
  onVersionChange(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of version change
   * @param {number} newVersion - New version
   * @param {number} oldVersion - Old version
   */
  notifyVersionChange(newVersion, oldVersion = null) {
    this.listeners.forEach(callback => {
      try {
        callback(newVersion, oldVersion);
      } catch (error) {
        this.log('Error in version change listener:', error);
      }
    });
  }

  /**
   * Set version manually (admin use)
   * @param {number} version - Version number to set
   * @returns {Promise<void>}
   */
  async setVersion(version) {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const docRef = this.db.collection(this.options.collection).doc(this.options.document);
      await docRef.set({
        version: version,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        metadata: {
          description: 'System version for cache invalidation',
          manuallySet: true,
          setAt: firebase.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      this.currentVersion = version;
      this.log(`Version manually set to: ${version}`);

      // Notify listeners
      this.notifyVersionChange(version);
    } catch (error) {
      this.log('Error setting version:', error);
      throw error;
    }
  }

  /**
   * Get version history
   * @param {number} limit - Number of history entries to retrieve
   * @returns {Promise<Array>} Version history
   */
  async getVersionHistory(limit = 10) {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const snapshot = await this.db
        .collection(this.options.collection)
        .doc(this.options.document)
        .collection('history')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const history = [];
      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return history;
    } catch (error) {
      this.log('Error getting version history:', error);
      return [];
    }
  }

  /**
   * Log version update to history
   * @param {Object} metadata - Update metadata
   * @returns {Promise<void>}
   */
  async logVersionUpdate(metadata = {}) {
    if (!this.db) {
      return;
    }

    try {
      await this.db
        .collection(this.options.collection)
        .doc(this.options.document)
        .collection('history')
        .add({
          version: this.currentVersion,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          metadata: metadata
        });

      this.log('Version update logged to history');
    } catch (error) {
      this.log('Error logging version update:', error);
    }
  }

  /**
   * Get version statistics
   * @returns {Promise<Object>} Version statistics
   */
  async getStats() {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const docRef = this.db.collection(this.options.collection).doc(this.options.document);
      const doc = await docRef.get();

      if (!doc.exists) {
        return {
          version: null,
          updateCount: 0,
          created: null,
          lastUpdated: null
        };
      }

      const data = doc.data();

      return {
        version: data.version,
        updateCount: data.updateCount || 0,
        created: data.created ? data.created.toDate().toISOString() : null,
        lastUpdated: data.lastUpdated ? data.lastUpdated.toDate().toISOString() : null,
        lastCheck: this.lastCheck ? new Date(this.lastCheck).toISOString() : null,
        checkInterval: this.options.checkInterval,
        autoIncrement: this.options.autoIncrement
      };
    } catch (error) {
      this.log('Error getting version stats:', error);
      throw error;
    }
  }

  /**
   * Reset version to 1 (admin use)
   * @returns {Promise<void>}
   */
  async reset() {
    await this.setVersion(1);
    this.log('Version reset to 1');
  }

  /**
   * Log message if logging enabled
   * @param {...*} args - Arguments to log
   */
  log(...args) {
    if (this.options.enableLogging) {
      console.log('[VersionTracker]', ...args);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopVersionChecking();
    this.listeners = [];
    this.log('Version tracker destroyed');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VersionTracker;
}
