[file name]: auth.js
[file content begin]
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
            if (this.onAuthStateChanged) {
                this.onAuthStateChanged(user);
            }
        });
    }

    async signUp(email, password, username) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Обновляем профиль с именем пользователя
            await userCredential.user.updateProfile({
                displayName: username
            });

            // Создаем запись пользователя в Firestore
            await this.db.collection('users').doc(userCredential.user.uid).set({
                username: username,
                email: email,
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
            
            // Обновляем время последнего входа
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

    async updateUserProfile(displayName, photoURL) {
        try {
            await this.auth.currentUser.updateProfile({
                displayName: displayName,
                photoURL: photoURL
            });
            
            // Обновляем данные в Firestore
            await this.db.collection('users').doc(this.user.uid).update({
                displayName: displayName,
                photoURL: photoURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: error.message };
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const user = this.auth.currentUser;
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email, 
                currentPassword
            );
            
            // Re-authenticate user
            await user.reauthenticateWithCredential(credential);
            
            // Change password
            await user.updatePassword(newPassword);
            
            return { success: true };
        } catch (error) {
            console.error('Error changing password:', error);
            return { success: false, error: error.message };
        }
    }

    getUserProfile() {
        if (!this.user) return null;
        
        return {
            displayName: this.user.displayName,
            email: this.user.email,
            photoURL: this.user.photoURL,
            uid: this.user.uid
        };
    }

    async syncCharacterToCloud(character) {
        if (!this.user) return { success: false, error: 'User not authenticated' };

        try {
            const characterData = {
                ...character,
                userId: this.user.uid,
                lastSynced: firebase.firestore.FieldValue.serverTimestamp()
            };

            let result;
            if (character.id) {
                // Обновляем существующего персонажа
                result = await this.db.collection('characters').doc(character.id.toString()).update(characterData);
            } else {
                // Создаем нового персонажа
                result = await this.db.collection('characters').add(characterData);
            }

            return { success: true, id: result.id };
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

// Глобальный экземпляр менеджера аутентификации
const authManager = new AuthManager();
[file content end]
