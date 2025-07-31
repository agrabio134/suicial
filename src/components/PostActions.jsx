import React, { useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';

export default function PostActions() {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton onClick={handleLike} sx={{ color: liked ? 'secondary.main' : 'text.secondary' }}>
        {liked ? <Favorite /> : <FavoriteBorder />}
      </IconButton>
      <Typography variant="body2" color="text.secondary">
        {likes} Likes
      </Typography>
    </Box>
  );
}