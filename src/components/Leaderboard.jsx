import React from 'react';
import { Box, Typography, Card, CardContent, Avatar } from '@mui/material';
import { Verified } from '@mui/icons-material';

export default function Leaderboard({ users }) {
  const sortedUsers = [...users].sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" color="text.primary" fontWeight="bold" sx={{ mb: 2 }}>
        Leaderboard 🏆
      </Typography>
      {sortedUsers.map((user, index) => (
        <Card
          key={user.address}
          sx={{
            mb: 1.5,
            borderRadius: 3,
            border: '1px solid rgba(0, 183, 255, 0.2)',
            transition: 'box-shadow 0.3s ease',
            '&:hover': { boxShadow: '0 4px 16px rgba(0, 183, 255, 0.3)' },
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2 }}>
            <Typography variant="h6" color="primary.main">
              #{index + 1}
            </Typography>
            <Avatar
              src={user.profileImage || ''}
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                fontWeight: 'bold',
              }}
            >
              {user.nickname ? user.nickname[0] : user.address[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  {user.nickname || user.address.slice(0, 6) + '...' + user.address.slice(-4)}
                </Typography>
                {user.verified && <Verified sx={{ color: 'primary.main', fontSize: 18 }} />}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Score: {user.rankingScore || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}