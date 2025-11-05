class AuthManager {
    constructor() {
        this.user = null;
        this.isInitialized = false;
        this.onAuthStateChanged = null;
        this.initFirebase();
    }

    initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyB0GvcaOCDiRcGh3MUBliarT6TwPbE5g4A",
            authDomain: "dnd-character-manager-10ea1.firebaseapp.com",
            projectId: "dnd-character-manager-10ea1",
            storageBucket: "dnd-character-manager-10ea1.firebasestorage.app",
            messagingSenderId: "449897270877",
            appId: "1:449897270877:web:8bbadb8b8a31f2f98a07b4",
            measurementId: "G-1DZSG1MCDS"
        };

        try {
            // Проверяем, не инициализирован ли Firebase уже
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Настройка persistence для лучшей синхронизации
            this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            this.setupAuthListener();
            this.isInitialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged(async (user) => {
            console.log('Auth state changed:', user ? user.email : 'No user');
            this.user = user;
            
            if (user) {
                console.log('User UID:', user.uid);
                // Обновляем токен для надежности
                try {
                    const token = await user.getIdToken(true);
                    console.log('User token refreshed');
                } catch (error) {
                    console.error('Token refresh error:', error);
                }
            }
            
            // Вызываем колбэк основного приложения
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(user);
            }
            
            this.updateAuthUI(user);
        }, (error) => {
            console.error('Auth state change error:', error);
        });
    }

    updateAuthUI(user) {
        const authSection = document.getElementById('auth-section');
        const userSection = document.getElementById('user-section');
        const userEmail = document.getElementById('user-email');
        const migrateBtn = document.getElementById('migrate-data');

        if (user && authSection && userSection && userEmail) {
            authSection.style.display = 'none';
            userSection.style.display = 'flex';
            userEmail.textContent = user.email;
            
            this.getUserProfile().then(profile => {
                const userAvatar = document.getElementById('user-avatar');
                if (profile && profile.avatar && userAvatar) {
                    userAvatar.textContent = profile.avatar;
                }
            });

            if (migrateBtn) {
                setTimeout(() => {
                    database.getLocalCharacters().then(localChars => {
                        migrateBtn.style.display = localChars.length > 0 ? 'inline-block' : 'none';
                    });
                }, 1000);
            }
        } else if (authSection && userSection) {
            authSection.style.display = 'flex';
            userSection.style.display = 'none';
            if (migrateBtn) migrateBtn.style.display = 'none';
        }
    }

    async signUp(email, password, username) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            
            await userCredential.user.updateProfile({
                displayName: username
            });

            await this.db.collection('users').doc(userCredential.user.uid).set({
                username: username,
                email: email,
                avatar: '😊',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            await this.db.collection('users').doc(userCredential.user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProfile(username, avatar) {
        try {
            await this.auth.currentUser.updateProfile({
                displayName: username
            });

            await this.db.collection('users').doc(this.user.uid).update({
                username: username,
                avatar: avatar,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const userAvatar = document.getElementById('user-avatar');
            if (userAvatar) {
                userAvatar.textContent = avatar;
            }

            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePassword(newPassword) {
        try {
            await this.auth.currentUser.updatePassword(newPassword);
            return { success: true };
        } catch (error) {
            console.error('Update password error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile() {
        if (!this.user) return null;
        
        try {
            const userDoc = await this.db.collection('users').doc(this.user.uid).get();
            return userDoc.exists ? userDoc.data() : null;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }

    async syncCharacterToCloud(character) {
        if (!this.user) return { success: false, error: 'Not authenticated' };

        try {
            const characterData = {
                ...character,
                userId: this.user.uid,
                source: 'cloud',
                lastSynced: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log('Syncing character to cloud:', characterData);

            let result;
            if (character.id && character.id.startsWith('cloud_')) {
                // Обновляем существующего облачного персонажа
                result = await this.db.collection('characters').doc(character.id).set(characterData, { merge: true });
                return { success: true, id: character.id };
            } else {
                // Создаем нового персонажа с новым cloud ID
                const cloudId = 'cloud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                characterData.id = cloudId;
                result = await this.db.collection('characters').doc(cloudId).set(characterData);
                return { success: true, id: cloudId };
            }
        } catch (error) {
            console.error('Sync character error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCloudCharacters() {
        if (!this.user) {
            console.log('No user, cannot get cloud characters');
            return [];
        }

        try {
            console.log('Fetching cloud characters for user:', this.user.uid);
            
            const snapshot = await this.db.collection('characters')
                .where('userId', '==', this.user.uid)
                .get();

            const characters = snapshot.docs.map(doc => {
                const data = doc.data();
                // Конвертируем Firestore timestamp в Date
                if (data.lastSynced && data.lastSynced.toDate) {
                    data.lastSynced = data.lastSynced.toDate();
                }
                if (data.createdAt && data.createdAt.toDate) {
                    data.createdAt = data.createdAt.toDate();
                }
                if (data.updatedAt && data.updatedAt.toDate) {
                    data.updatedAt = data.updatedAt.toDate();
                }
                return {
                    id: doc.id,
                    ...data
                };
            });
            
            // Сортируем по дате обновления (новые сначала)
            characters.sort((a, b) => {
                const dateA = a.lastSynced || a.updatedAt || new Date(0);
                const dateB = b.lastSynced || b.updatedAt || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });
            
            console.log(`Loaded ${characters.length} cloud characters for user ${this.user.uid}`, characters);
            return characters;
        } catch (error) {
            console.error('Get cloud characters error:', error);
            return [];
        }
    }

    async deleteCloudCharacter(characterId) {
        if (!this.user) return false;

        try {
            console.log('Deleting cloud character:', characterId);
            await this.db.collection('characters').doc(characterId).delete();
            console.log('Cloud character deleted successfully');
            return true;
        } catch (error) {
            console.error('Delete cloud character error:', error);
            return false;
        }
    }

    getCurrentUser() {
        return this.user;
    }

    isSignedIn() {
        return this.user !== null;
    }
}

const authManager = new AuthManager();
