import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Box, Typography, Avatar, IconButton, TextField, Button } from '@mui/material';
import { Favorite, FavoriteBorder, Bookmark, BookmarkBorder, Comment, Verified } from '@mui/icons-material';
import { doc, updateDoc, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet } from '@suiet/wallet-kit';

export default function Post({ id, username, content, image, timestamp, likes, saved, boosted, db, wallet }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes || 0);
  const [isSaved, setIsSaved] = useState(saved || false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userData, setUserData] = useState({ nickname: username, verified: false });

  useEffect(() => {
    const commentsQuery = query(collection(db, `posts/${id}/comments`), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    }, (error) => console.error('Error fetching comments:', error));

    const userDoc = doc(db, 'users', username);
    const unsubscribeUser = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    }, (error) => console.error('Error fetching user data:', error));

    return () => {
      unsubscribe();
      unsubscribeUser();
    };
  }, [db, id, username]);

  const handleLike = async () => {
    const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
    setIsLiked(!isLiked);
    setLikeCount(newLikeCount);
    try {
      await updateDoc(doc(db, 'posts', id), { likes: newLikeCount });
      const userDoc = doc(db, 'users', username);
      const userSnapshot = await userDoc.get();
      const userData = userSnapshot.data();
      await updateDoc(userDoc, {
        rankingScore: (userData.rankingScore || 0) + (isLiked ? -1 : 1),
      });
    } catch (error) {
      console.error('Error updating likes:', error);
      alert('Failed to update likes. Please try again.');
    }
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    try {
      await updateDoc(doc(db, 'posts', id), { saved: !isSaved });
    } catch (error) {
      console.error('Error updating save status:', error);
      alert('Failed to save post. Please try again.');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      alert('Please connect your wallet first!');
      return;
    }
    if (newComment.trim()) {
      try {
        await addDoc(collection(db, `posts/${id}/comments`), {
          username: wallet.account?.address || 'Anonymous',
          content: newComment,
          timestamp: new Date().toLocaleString(),
        });
        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
      }
    }
  };

  const handleBoost = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first!');
      return;
    }
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [500_000_000]); // 0.5 SUI
      tx.transferObjects([coin], '0x5c1f8fdeb920041285d97098593c26358ba9fba799aeee8ed108b4e2ff0c2a5b');
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
        chain: 'sui:mainnet',
      });
      if (result) {
        await updateDoc(doc(db, 'posts', id), { boosted: true });
        alert('Post boosted successfully!');
      }
    } catch (error) {
      console.error('Error boosting post:', error);
      alert('Failed to boost post. Please try again.');
    }
  };

  return (
    <Card
      className={boosted ? 'boosted' : ''}
      sx={{
        mb: 3,
        borderRadius: 4,
        border: '1px solid #00b7ff',
        bgcolor: '#1e1e1e',
        boxShadow: '0 8px 24px rgba(0, 183, 255, 0.3)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 12px 32px rgba(0, 183, 255, 0.4)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
          <Avatar
            src={userData.profileImage || ''}
            sx={{
              bgcolor: '#00b7ff',
              width: 48,
              height: 48,
              fontWeight: 'bold',
              fontSize: '1.2rem',
              boxShadow: '0 0 8px rgba(0, 183, 255, 0.5)',
            }}
          >
            {userData.nickname ? userData.nickname[0] : username[0].toUpperCase()}
          </Avatar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#fff">
              {userData.nickname || username.slice(0, 6) + '...' + username.slice(-4)}
            </Typography>
            {userData.verified && <Verified sx={{ color: '#00b7ff', fontSize: 20 }} />}
          </Box>
        </Box>
        {image && (
          <CardMedia
            component="img"
            image={image}
            alt="Post image"
            sx={{
              borderRadius: 3,
              mb: 2,
              maxHeight: 500,
              objectFit: 'cover',
              width: '100%',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.01)' },
            }}
          />
        )}
        <Typography variant="body1" color="#fff" sx={{ mb: 2, lineHeight: 1.6 }}>
          {content}
        </Typography>
        <Typography variant="caption" color="#b0b0b0" sx={{ mb: 2, display: 'block' }}>
          {timestamp}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <IconButton
            onClick={handleLike}
            sx={{
              color: isLiked ? '#e91e63' : '#b0b0b0',
              '&:hover': { color: '#e91e63' },
              transition: 'color 0.2s ease',
            }}
          >
            {isLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="caption" color="#b0b0b0">
            {likeCount} Likes
          </Typography>
          <IconButton
            onClick={handleSave}
            sx={{
              color: isSaved ? '#00b7ff' : '#b0b0b0',
              '&:hover': { color: '#00b7ff' },
              transition: 'color 0.2s ease',
            }}
          >
            {isSaved ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
          <IconButton sx={{ color: '#b0b0b0', '&:hover': { color: '#00b7ff' } }}>
            <Comment />
          </IconButton>
          {!boosted && (
            <Button
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
                color: '#fff',
                fontSize: '0.85rem',
                borderRadius: 3,
                px: 2,
                '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(0, 183, 255, 0.4)' },
              }}
              onClick={handleBoost}
            >
              Boost (0.5 SUI)
            </Button>
          )}
        </Box>
        <Box sx={{ mt: 2 }}>
          {comments.map((comment, index) => (
            <Box
              key={comment.id}
              sx={{
                mb: 1.5,
                pl: 2,
                display: 'flex',
                gap: 1,
                animation: `slideIn 0.3s ease-in-out ${index * 0.1}s both`,
              }}
            >
              <Typography variant="body2" color="#fff" fontWeight="bold">
                {comment.username.slice(0, 6) + '...'}:
              </Typography>
              <Typography variant="body2" color="#fff">
                {comment.content}
              </Typography>
            </Box>
          ))}
          <Box component="form" onSubmit={handleComment} sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <TextField
              size="small"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#00b7ff' },
                  '&:hover fieldset': { borderColor: '#e91e63' },
                  '& .MuiInputBase-input': { fontSize: '0.9rem', color: '#fff' },
                },
              }}
            />
            <Button
              type="submit"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
                color: '#fff',
                fontSize: '0.9rem',
                borderRadius: 3,
                px: 2,
                '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(0, 183, 255, 0.4)' },
              }}
            >
              Post
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}