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
import './index.css';

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
  <></>
  );
}