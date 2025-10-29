class AuthManager {
    constructor() {
        this.user = null;
        this.isInitialized = false;
        this.onAuthStateChanged = null; // Колбэк для основного приложения
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
            firebase.initializeApp(firebaseConfig);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.setupAuthListener();
            this.isInitialized = true;
            console.log('Firebase initialized');
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    }

    setupAuthListener() {
        this.auth.onAuthStateChanged((user) => {
            this.user = user;
            console.log('Auth state changed:', user ? user.email : 'No user');
            
            // Вызываем колбэк основного приложения
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(user);
            }
            
            // Обновляем UI напрямую на всякий случай
            this.updateAuthUI(user);
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
            
            // Загружаем и устанавливаем аватар
            this.getUserProfile().then(profile => {
                const userAvatar = document.getElementById('user-avatar');
                if (profile && profile.avatar && userAvatar) {
                    userAvatar.textContent = profile.avatar;
                }
            });

            // Показываем кнопку миграции
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

            // Обновляем аватар в UI
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
                lastSynced: firebase.firestore.FieldValue.serverTimestamp()
            };

            let result;
            if (character.id && character.id.toString().length < 20) {
                // Это cloud ID - обновляем существующего персонажа
                result = await this.db.collection('characters').doc(character.id.toString()).update(characterData);
                return { success: true, id: character.id };
            } else {
                // Создаем нового персонажа
                result = await this.db.collection('characters').add(characterData);
                return { success: true, id: result.id };
            }
        } catch (error) {
            console.error('Sync character error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCloudCharacters() {
        if (!this.user) return [];

        try {
            const snapshot = await this.db.collection('characters')
                .where('userId', '==', this.user.uid)
                .orderBy('lastSynced', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Get cloud characters error:', error);
            return [];
        }
    }

    async deleteCloudCharacter(characterId) {
        if (!this.user) return false;

        try {
            await this.db.collection('characters').doc(characterId).delete();
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
