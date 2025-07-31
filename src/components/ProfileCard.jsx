import React from 'react';
import { Card, Box, CardContent, Avatar, Typography, Button } from '@mui/material';
import { Verified } from '@mui/icons-material';

export default function ProfileCard({ user, isOwnProfile, handleFollow, handleEditProfile }) {
  return (
    <Card
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
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Avatar
          src={user.profileImage || ''}
          sx={{
            width: 100,
            height: 100,
            mx: 'auto',
            mb: 2,
            border: '3px solid transparent',
            background: 'linear-gradient(135deg, #00b7ff, #e91e63) border-box',
            boxShadow: '0 0 12px rgba(0, 183, 255, 0.5)',
            fontSize: '2rem',
            fontWeight: 'bold',
          }}
        >
          {user.nickname ? user.nickname[0] : user.address[0].toUpperCase()}
        </Avatar>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
          <Typography variant="h6" fontWeight="bold" color="#fff">
            {user.nickname || user.address.slice(0, 6) + '...' + user.address.slice(-4)}
          </Typography>
          {user.verified && <Verified sx={{ color: '#00b7ff', fontSize: 24 }} />}
        </Box>
        <Typography variant="body2" color="#b0b0b0" sx={{ mb: 1.5 }}>
          Score: {user.rankingScore || 0}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 2 }}>
          <Typography variant="body2" color="#fff">
            <strong>{user.followers?.length || 0}</strong> Followers
          </Typography>
          <Typography variant="body2" color="#fff">
            <strong>{user.following?.length || 0}</strong> Following
          </Typography>
        </Box>
        {!isOwnProfile && (
          <Button
            variant="contained"
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #00b7ff, #e91e63)',
              fontSize: '1rem',
              borderRadius: 4,
              py: 1.5,
              boxShadow: '0 4px 12px rgba(0, 183, 255, 0.4)',
              '&:hover': { transform: 'scale(1.02)', boxShadow: '0 6px 16px rgba(0, 183, 255, 0.5)' },
            }}
            onClick={() => handleFollow(user.address)}
          >
            {user.followers?.includes(user.address) ? 'Unfollow' : 'Follow'}
          </Button>
        )}
        {isOwnProfile && (
          <Button
            variant="outlined"
            fullWidth
            sx={{
              borderColor: '#00b7ff',
              color: '#00b7ff',
              fontSize: '1rem',
              borderRadius: 4,
              py: 1.5,
              '&:hover': { bgcolor: 'rgba(0, 183, 255, 0.1)', transform: 'scale(1.02)' },
            }}
            onClick={handleEditProfile}
          >
            Edit Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}