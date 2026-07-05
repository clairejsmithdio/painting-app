import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase credentials not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface CreateBoardRequest {
  userId: string;
  title: string;
  description?: string;
  originalImageUrl: string;
  finalImageUrl: string;
  styleId?: string;
  medium?: string;
  paletteColors?: string[];
}

// Create a new board
router.post('/boards', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { userId, title, description, originalImageUrl, finalImageUrl, styleId, medium, paletteColors } = req.body as CreateBoardRequest;

    if (!userId || !title || !originalImageUrl || !finalImageUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('boards')
      .insert([
        {
          user_id: userId,
          title,
          description,
          original_image_url: originalImageUrl,
          final_image_url: finalImageUrl,
          style_id: styleId,
          medium,
          palette_colors: paletteColors || [],
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({
      error: 'Failed to create board',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all boards (with pagination)
router.get('/boards', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('boards')
      .select('*, profiles(username, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      boards: data,
      total: count,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({
      error: 'Failed to fetch boards',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get single board with comments and likes count
router.get('/boards/:id', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { id } = req.params;

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*, profiles(username, avatar_url)')
      .eq('id', id)
      .single();

    if (boardError) {
      console.error('Supabase error:', boardError);
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get comments
    const { data: comments } = await supabase
      .from('board_comments')
      .select('*, profiles(username, avatar_url)')
      .eq('board_id', id)
      .order('created_at', { ascending: false });

    // Get likes count
    const { count: likesCount } = await supabase
      .from('board_likes')
      .select('*', { count: 'exact' })
      .eq('board_id', id);

    res.json({
      ...board,
      comments: comments || [],
      likesCount: likesCount || 0,
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({
      error: 'Failed to fetch board',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Like a board
router.post('/boards/:id/like', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const { data, error } = await supabase
      .from('board_likes')
      .insert([{ board_id: id, user_id: userId }])
      .select();

    if (error) {
      // If duplicate, it means already liked - return success
      if (error.code === '23505') {
        return res.json({ message: 'Already liked' });
      }
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ liked: true });
  } catch (error) {
    console.error('Like board error:', error);
    res.status(500).json({
      error: 'Failed to like board',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Unlike a board
router.post('/boards/:id/unlike', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const { error } = await supabase
      .from('board_likes')
      .delete()
      .eq('board_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ liked: false });
  } catch (error) {
    console.error('Unlike board error:', error);
    res.status(500).json({
      error: 'Failed to unlike board',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Add comment to board
router.post('/boards/:id/comments', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { id } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content required' });
    }

    const { data, error } = await supabase
      .from('board_comments')
      .insert([{ board_id: id, user_id: userId, content }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
