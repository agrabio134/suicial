import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import { Home, Person, Timeline, CurrencyBitcoin, Wallet } from '@mui/icons-material';

export default function Sidebar({ wallet }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #00b7ff, #1e1e1e)',
          color: 'white',
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0, 183, 255, 0.3)',
        },
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="white">
          SUICIAL Social
        </Typography>
      </Box>
      <List>
        {[
          { text: 'Home', icon: <Home sx={{ color: 'white' }} /> },
          { text: 'Profile', icon: <Person sx={{ color: 'white' }} /> },
          { text: 'Timeline', icon: <Timeline sx={{ color: 'white' }} /> },
          { text: 'Sui Wallet', icon: <Wallet sx={{ color: 'white' }} /> },
          { text: 'SUICIAL Coin', icon: <CurrencyBitcoin sx={{ color: 'white' }} /> },
        ].map((item) => (
          <ListItem
            button
            key={item.text}
            sx={{
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', transition: 'background 0.2s' },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} sx={{ '& .MuiListItemText-primary': { color: 'white' } }} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}