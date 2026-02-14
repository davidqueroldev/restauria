import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pptijxnpyrswvqwcmjdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdGlqeG5weXJzd3Zxd2NtamRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDU3NzEsImV4cCI6MjA4NjM4MTc3MX0.uarZ64CGfvCm_AxS9LWvHyfRTuRdqOqOHt_lYLWnKxA'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMenuItemInsertion() {
  console.log('Testing Menu Item Insertion...');

  // 1. Sign in as manager
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'manager@restauria.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  console.log('Signed in as:', authData.user.id);

  // 2. Get a category
  const { data: categories } = await supabase.from('menu_categories').select('id, name').limit(1);
  if (!categories || categories.length === 0) {
    console.error('No categories found');
    return;
  }

  const categoryId = categories[0].id;
  console.log(`Inserting into category: ${categories[0].name} (${categoryId})`);

  // 3. Attempt insert
  const { data, error } = await supabase.from('menu_items').insert({
    category_id: categoryId,
    name: 'Debug Dish ' + Date.now(),
    description: 'Test description',
    price: 9.99,
    stock: 10,
    is_active: true,
    sort_order: 99
  }).select();

  if (error) {
    console.error('Insertion ERROR:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('Insertion SUCCESS:', data);
  }
}

testMenuItemInsertion();
