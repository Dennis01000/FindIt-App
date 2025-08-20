import { Text, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import ItemCard from '../components/ItemCard';
import { commonStyles, buttonStyles } from '../styles/commonStyles';

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  category: 'lost' | 'found';
  location: string;
  dateReported: string;
  contactInfo: string;
  imageUri?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'resolved';
}

const STORAGE_KEY = 'lostFoundItems';

export default function MainScreen() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');

  const loadItems = useCallback(async () => {
    try {
      const storedItems = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        setItems(parsedItems);
        console.log('Loaded items:', parsedItems.length);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  }, []);

  const saveItems = useCallback(async (newItems: LostFoundItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      console.log('Saved items to storage:', newItems.length);
    } catch (error) {
      console.error('Error saving items:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Only add storage event on web
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed');
      loadItems();
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [loadItems]);

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = items.filter(item => item.id !== itemId);
            setItems(updatedItems);
            await saveItems(updatedItems);
            Alert.alert('Deleted', 'Item deleted successfully.');
          }
        }
      ]
    );
  };

  const handleMarkResolved = async (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, status: 'resolved' } : item
    );
    setItems(updatedItems);
    await saveItems(updatedItems);
    Alert.alert('Success', 'Item marked as resolved.');
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.content}>
        <Text style={commonStyles.title}>Lost & Found</Text>
        <Text style={commonStyles.text}>Help reunite people with their belongings</Text>

        {/* Filter Buttons */}
        <View style={{ flexDirection: 'row', marginVertical: 20, gap: 10 }}>
          <Button
            text="All"
            onPress={() => setFilter('all')}
            style={[
              buttonStyles.instructionsButton,
              { flex: 1, backgroundColor: filter === 'all' ? '#193cb8' : '#162456' }
            ]}
          />
          <Button
            text="Lost"
            onPress={() => setFilter('lost')}
            style={[
              buttonStyles.instructionsButton,
              { flex: 1, backgroundColor: filter === 'lost' ? '#193cb8' : '#162456' }
            ]}
          />
          <Button
            text="Found"
            onPress={() => setFilter('found')}
            style={[
              buttonStyles.instructionsButton,
              { flex: 1, backgroundColor: filter === 'found' ? '#193cb8' : '#162456' }
            ]}
          />
        </View>

        {/* Report Button */}
        <View style={commonStyles.buttonContainer}>
          <Button
            text="Report Lost/Found Item"
            onPress={() => router.push('/add-item')}
            style={buttonStyles.instructionsButton}
          />
        </View>

        {/* Items List */}
        <ScrollView
          style={{ flex: 1, width: '100%', marginTop: 20 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredItems.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={commonStyles.text}>
                {filter === 'all'
                  ? 'No items reported yet.'
                  : `No ${filter} items reported.`}
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={() => router.push(`/edit-item?id=${item.id}`)}
                onDelete={() => handleDeleteItem(item.id)}
                onMarkResolved={() => handleMarkResolved(item.id)}
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
