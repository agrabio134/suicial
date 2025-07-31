import React, { useState } from 'react';
import { Box, Modal, TextField, Button, Typography, CircularProgress, Tooltip } from '@mui/material';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet } from '@suiet/wallet-kit';
import axios from 'axios';

export default function PostFormModal({ open, handleClose, db, wallet, setWalletError, setWalletSuccess }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhMTNlMDlhMy1hYmJjLTQwOWYtOTdmMi1mNGY0N2Y2ODUzZDYiLCJlbWFpbCI6ImFncmFiaW9oYXJ2ZXlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImVmMzE5ZWU5ZjJiZTFmNDIxNGEyIiwic2NvcGVkS2V5U2VjcmV0IjoiNjJhNzVkZDY0MTM1YmIxNGNlNjNjNWVlOTk2MzgyOWQ3NWYwZmEzYzI2OTI2MmUyNTJmNTk0MDhiZTRhMzA1OCIsImV4cCI6MTc4NTQ3NDc1Mn0.4hFeV1P0I9D8bnic1m8JqJYG2OeQT4awDYPlmbsCNKw';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setWalletError('Image size must be less than 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setWalletError('Please upload a valid image file.');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBoost = async () => {
    if (!wallet.connected) {
      setWalletError('Please connect your wallet first!');
      return false;
    }
    setIsBoosting(true);
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [100_000_000]); // 0.1 SUI
      tx.transferObjects([coin], '0xdc0227a0a151779ec51da0f125c7ff319594fa98b2f191408a4e567db134a308');
      const result = await wallet.signAndExecuteTransaction({
        transaction: tx,
        chain: 'sui:mainnet',
      });
      return !!result;
    } catch (error) {
      setWalletError('Failed to boost post. Ensure sufficient SUI balance and try again.');
      console.error('Boost error:', error);
      return false;
    } finally {
      setIsBoosting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      setWalletError('Please connect your wallet first!');
      return;
    }
    if (!content.trim()) {
      setWalletError('Please enter post content.');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = '';
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('pinataMetadata', JSON.stringify({
          name: `post_${wallet.account.address}_${Date.now()}`,
          keyvalues: { userAddress: wallet.account.address },
        }));
        formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

        try {
          const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
              Authorization: `Bearer ${PINATA_JWT}`,
              'Content-Type': 'multipart/form-data',
            },
          });

          if (response.data.IpfsHash) {
            imageUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
          } else {
            throw new Error('No IPFS hash returned from Pinata');
          }
        } catch (uploadError) {
          console.error('Pinata upload error:', uploadError.response?.data || uploadError.message);
          setWalletError('Failed to upload image to Pinata. Post will be created without an image.');
        }
      }

      const boosted = await handleBoost();
      await addDoc(collection(db, 'posts'), {
        username: wallet.account.address,
        content: content.trim(),
        image: imageUrl,
        timestamp: new Date().toLocaleString(),
        likes: 0,
        saved: false,
        boosted,
      });
      setWalletSuccess('Post created successfully!');
      setContent('');
      setImage(null);
      setImagePreview('');
      handleClose();
    } catch (error) {
      setWalletError('Failed to create post. Please try again.');
      console.error('Post creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          bgcolor: 'rgba(30, 30, 30, 0.95)',
          border: '2px solid #00b7ff',
          boxShadow: '0 12px 32px rgba(0, 183, 255, 0.5)',
          borderRadius: 4,
          p: 3,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#ffffff' }}>
          Create Post
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="What's on your mind?"
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        <Tooltip title="Fixing bugs">
        <span>
            <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
            disabled
            >
            Upload
            </Button>
        </span>
        </Tooltip>
          {imagePreview && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  border: '2px solid #00b7ff',
                }}
              />
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || isBoosting}
              sx={{ flex: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Post'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{ flex: 1 }}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
}