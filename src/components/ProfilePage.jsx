import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import ProfileCard from './ProfileCard';
import Post from './Post';
import EditProfileModal from './EditProfileModal';

export default function ProfilePage({ db, wallet, handleFollow, setWalletError, setWalletSuccess }) {
  const { address } = useParams();
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEditModal, setOpenEditModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    const userDoc = doc(db, 'users', address);
    const unsubscribeUser = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        setUserData({ address, ...doc.data() });
      } else {
        setUserData({ address, nickname: '', profileImage: '', followers: [], following: [], rankingScore: 0, verified: false });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching user data:', error);
      setLoading(false);
    });

    const postsQuery = query(collection(db, 'posts'), where('username', '==', address));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    }, (error) => console.error('Error fetching posts:', error));

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [db, address]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress sx={{ color: '#00b7ff' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {userData && (
        <ProfileCard
          user={userData}
          isOwnProfile={wallet.connected && wallet.account?.address === address}
          handleFollow={handleFollow}
          handleEditProfile={() => setOpenEditModal(true)}
        />
      )}
      <Typography variant="h6" color="#fff" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
        Posts
      </Typography>
      {posts.length === 0 ? (
        <Typography variant="body2" color="#b0b0b0" sx={{ textAlign: 'center' }}>
          No posts yet.
        </Typography>
      ) : (
        posts.map((post) => (
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
          />
        ))
      )}
      <EditProfileModal
        open={openEditModal}
        handleClose={() => setOpenEditModal(false)}
        db={db}
        wallet={wallet}
        setWalletError={setWalletError}
        setWalletSuccess={setWalletSuccess}
        userData={userData}
      />
    </Box>
  );
}