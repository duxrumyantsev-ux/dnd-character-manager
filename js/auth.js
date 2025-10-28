class AuthManager {
    constructor() {
        this.user = null;
        this.isInitialized = false;
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
            this.onAuthStateChanged(user);
        });
    }

    onAuthStateChanged(user) {
        // Этот метод будет переопределен в основном приложении
        if (user) {
            console.log('User signed in:', user.email);
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('user-section').style.display = 'flex';
            document.getElementById('user-email').textContent = user.email;
        } else {
            console.log('User signed out');
            document.getElementById('auth-section').style.display = 'flex';
            document.getElementById('user-section').style.display = 'none';
        }
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

    async syncCharacterToCloud(character) {
        if (!this.user) return null;

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