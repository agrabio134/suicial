import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Avatar, Typography, Snackbar, Alert } from '@mui/material';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { ConnectButton, useWallet } from '@suiet/wallet-kit';
import Header from './components/Header';
import Post from './components/Post';
import PostFormModal from './components/PostFormModal';
import ProfileCard from './components/ProfileCard';
import BottomNav from './components/BottomNav';
import ProfilePage from './components/ProfilePage';
import Leaderboard from './components/Leaderboard';
import FabButton from './components/FabButton';
import '@fontsource/roboto';
import './app.css';

const firebaseConfig = {
  apiKey: "AIzaSyAHbw1COmnjMdAwv3SpA7G2ff-TONM0QCA",
  authDomain: "suicial.firebaseapp.com",
  projectId: "suicial",
  storageBucket: "suicial.firebasestorage.app",
  messagingSenderId: "436856335067",
  appId: "1:436856335067:web:acfc66afe9829e3e4c3afe",
  measurementId: "G-VHPLEVBR34"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [posts, setPosts] = useState([]);
  const [openPostModal, setOpenPostModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([]);
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');
  const wallet = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    signInAnonymously(auth)
      .then(() => console.log('Signed in anonymously'))
      .catch((error) => console.error('Anonymous auth error:', error));

    const postsQuery = collection(db, 'posts');
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    }, (error) => console.error('Error fetching posts:', error));

    const usersQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        address: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    }, (error) => console.error('Error fetching users:', error));

    return () => {
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, [db]);

  useEffect(() => {
    if (wallet.connected && wallet.account?.address) {
      const userDoc = doc(db, 'users', wallet.account.address);
      const unsubscribe = onSnapshot(userDoc, (doc) => {
        if (doc.exists()) {
          setUserData({ address: wallet.account.address, ...doc.data() });
        } else {
          setUserData({ address: wallet.account.address, nickname: '', profileImage: '', followers: [], following: [], rankingScore: 0, verified: false });
        }
      }, (error) => {
        setWalletError('Error fetching user data. Please refresh.');
        console.error('Error fetching user data:', error);
      });
      return () => unsubscribe();
    } else {
      setUserData(null);
    }
  }, [wallet.connected, wallet.account]);

  const handleFollow = async (address) => {
    if (!wallet.connected) {
      setWalletError('Please connect your wallet first!');
      return;
    }
    try {
      const currentUserDoc = doc(db, 'users', wallet.account.address);
      const targetUserDoc = doc(db, 'users', address);
      const currentUserSnapshot = await getDoc(currentUserDoc);
      const currentUserData = currentUserSnapshot.exists() ? currentUserSnapshot.data() : { following: [] };
      const isFollowing = currentUserData.following?.includes(address);

      await setDoc(
        currentUserDoc,
        {
          following: isFollowing
            ? currentUserData.following.filter((addr) => addr !== address)
            : [...(currentUserData.following || []), address],
        },
        { merge: true }
      );

      const targetUserSnapshot = await getDoc(targetUserDoc);
      const targetUserData = targetUserSnapshot.exists() ? targetUserSnapshot.data() : { followers: [] };
      await setDoc(
        targetUserDoc,
        {
          followers: isFollowing
            ? targetUserData.followers?.filter((addr) => addr !== wallet.account.address) || []
            : [...(targetUserData.followers || []), wallet.account.address],
        },
        { merge: true }
      );
      setWalletSuccess(isFollowing ? 'Unfollowed successfully!' : 'Followed successfully!');
    } catch (error) {
      console.error('Error updating follow status:', error);
      setWalletError('Failed to update follow status. Please try again.');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <CssBaseline />
      <Header wallet={wallet} setWalletError={setWalletError} setWalletSuccess={setWalletSuccess} />
      <Box sx={{ display: { xs: 'none', md: 'flex' }, width: 280, p: 3, flexShrink: 0 }}>
        <Box sx={{ position: 'fixed', width: 240, top: 80 }}>
          {userData && (
            <ProfileCard
              user={userData}
              isOwnProfile={true}
              handleFollow={handleFollow}
              handleEditProfile={() => setOpenEditModal(true)}
            />
          )}
          <ConnectButton
            sx={{
              mt: 2,
              background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
              color: '#fff',
              borderRadius: 2,
              py: 1.5,
              fontSize: '1rem',
              '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(0, 183, 255, 0.4)' },
            }}
            onConnectSuccess={() => setWalletSuccess('Wallet connected successfully!')}
            onConnectError={() => setWalletError('Failed to connect wallet. Please try again.')}
          />
        </Box>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          maxWidth: { xs: '100%', md: 640 },
          mx: 'auto',
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Box className="story-container" sx={{ display: 'flex', overflowX: 'auto', gap: 1.5, mb: 3, py: 1.5, px: 1 }}>
                  {users.map((user) => (
                    <Box
                      key={user.address}
                      sx={{
                        flexShrink: 0,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'scale(1.1)' },
                      }}
                      onClick={() => navigate(`/profile/${user.address}`)}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={user.profileImage || ''}
                          sx={{
                            width: 64,
                            height: 64,
                            mb: 0.5,
                            border: '3px solid transparent',
                            background: 'linear-gradient(135deg, #00b7ff, #e91e63) border-box',
                            boxShadow: '0 0 8px rgba(0, 183, 255, 0.5)',
                          }}
                        >
                          {user.nickname ? user.nickname[0] : user.address[0].toUpperCase()}
                        </Avatar>
                      </Box>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        {user.nickname || user.address.slice(0, 6)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    id={post.id}
                    username={post.username}
                    content={post.content}
                    image={post.image}
                    timestamp={post.timestamp}
                    likes={post.likes}
                    saved={post.saved}
                    boosted={post.boosted}
                    db={db}
                    wallet={wallet}
                    setWalletError={setWalletError}
                    setWalletSuccess={setWalletSuccess}
                  />
                ))}
              </>
            }
          />
          <Route
            path="/profile/:address"
            element={
              <ProfilePage
                db={db}
                wallet={wallet}
                handleFollow={handleFollow}
                setWalletError={setWalletError}
                setWalletSuccess={setWalletSuccess}
              />
            }
          />
          <Route path="/leaderboard" element={<Leaderboard users={users} />} />
        </Routes>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, width: 280, p: 3, flexShrink: 0 }}>
        <Box sx={{ position: 'fixed', width: 240, top: 80, right: 0 }}>
          <Typography variant="h6" color="text.primary" fontWeight="bold" sx={{ mb: 2 }}>
            Suggested
          </Typography>
          {users.slice(0, 3).map((user) => (
            <Box
              key={user.address}
              sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${user.address}`)}
            >
              <Avatar
                src={user.profileImage || ''}
                sx={{ width: 40, height: 40, mr: 1, bgcolor: 'primary.main' }}
              >
                {user.nickname ? user.nickname[0] : user.address[0].toUpperCase()}
              </Avatar>
              <Typography variant="body2" color="text.primary">
                {user.nickname || user.address.slice(0, 6) + '...'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <BottomNav navigate={navigate} setOpenPostModal={setOpenPostModal} wallet={wallet} setWalletError={setWalletError} />
      </Box>
      <FabButton setOpenPostModal={setOpenPostModal} />
      <PostFormModal
        open={openPostModal}
        handleClose={() => setOpenPostModal(false)}
        db={db}
        wallet={wallet}
        setWalletError={setWalletError}
        setWalletSuccess={setWalletSuccess}
      />
      <Snackbar
        open={!!walletError}
        autoHideDuration={6000}
        onClose={() => setWalletError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setWalletError('')} severity="error" sx={{ width: '100%', bgcolor: '#e91e63', color: '#fff' }}>
          {walletError}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!walletSuccess}
        autoHideDuration={6000}
        onClose={() => setWalletSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setWalletSuccess('')} severity="success" sx={{ width: '100%', bgcolor: '#00b7ff', color: '#fff' }}>
          {walletSuccess}
        </Alert>
      </Snackbar>
    </Box>
  );
}