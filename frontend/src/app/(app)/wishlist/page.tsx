'use client';

import { useState } from 'react';
import WishlistItem from '@/components/wishlist/WishlistItem';
import { Button } from '@/components/ui/button';
import { PlusCircle, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Item {
  id: string;
  imageUrl?: string;
  name: string;
  price: string;
  platform: string;
  productUrl: string;
}

const initialMockWishlist: Item[] = [
  { id: '1', name: 'Wireless Earbuds Pro', price: '₹2,499', platform: 'Flipkart', productUrl: '#', imageUrl: 'https://placehold.co/100x100.png?text=Earbuds' },
  { id: '2', name: 'Smartwatch Series 7', price: '₹15,999', platform: 'Amazon.in', productUrl: '#', imageUrl: 'https://placehold.co/100x100.png?text=Watch' },
  { id: '3', name: 'Running Shoes XYZ', price: '₹3,200', platform: 'Myntra', productUrl: '#', imageUrl: 'https://placehold.co/100x100.png?text=Shoes' },
];

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<Item[]>(initialMockWishlist);
  const [searchTerm, setSearchTerm] = useState('');

  const handleRemoveItem = (id: string) => {
    setWishlistItems(items => items.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    // In a real app, this would open a modal or navigate to a search/add product page
    const newItemId = (wishlistItems.length + 1).toString();
    const newItem: Item = {
      id: newItemId,
      name: `New Product ${newItemId}`,
      price: `₹${Math.floor(Math.random() * 5000) + 500}`,
      platform: ['Amazon.in', 'Flipkart', 'Myntra'][Math.floor(Math.random() * 3)],
      productUrl: '#',
      imageUrl: `https://placehold.co/100x100.png?text=New${newItemId}`
    };
    setWishlistItems(items => [newItem, ...items]);
  };
  
  const filteredItems = wishlistItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <Input 
          type="search" 
          placeholder="Search wishlist..." 
          className="flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handleAddItem} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <WishlistItem
              key={item.id}
              {...item}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No items found</h3>
          <p className="text-sm text-muted-foreground">
            {wishlistItems.length === 0 ? "Your wishlist is empty. Add some products!" : "Try a different search term."}
          </p>
        </div>
      )}
    </div>
  );
}
