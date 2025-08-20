import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import type { LostFoundItem } from './index';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'lost' | 'found'>('lost');
  const [location, setLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load item data
  useEffect(() => {
    const loadItem = async () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedItems = localStorage.getItem('lostFoundItems');
          if (storedItems) {
            const items: LostFoundItem[] = JSON.parse(storedItems);
            const item = items.find(item => item.id === id);
            
            if (item) {
              setTitle(item.title);
              setDescription(item.description);
              setCategory(item.category);
              setLocation(item.location);
              setContactInfo(item.contactInfo);
              setImageUri(item.imageUri || null);
              if (item.latitude && item.longitude) {
                setCoordinates({ latitude: item.latitude, longitude: item.longitude });
              }
              console.log('Loaded item for editing:', item);
            } else {
              Alert.alert('Error', 'Item not found');
              router.back();
            }
          }
        }
      } catch (error) {
        console.error('Error loading item:', error);
        Alert.alert('Error', 'Failed to load item');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadItem();
    }
  }, [id]);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        console.log('Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        console.log('Photo taken:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions to use current location.');
        setLoadingLocation(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      
      setCoordinates({ latitude, longitude });
      
      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const locationString = [
          address.name,
          address.street,
          address.city,
          address.region
        ].filter(Boolean).join(', ');
        
        setLocation(locationString || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        console.log('Current location set:', locationString);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please enter manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const removeImage = () => {
    setImageUri(null);
    console.log('Image removed');
  };

  const handleUpdate = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    if (!contactInfo.trim()) {
      Alert.alert('Error', 'Please enter contact information');
      return;
    }

    try {
      // Get existing items
      let existingItems: LostFoundItem[] = [];
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedItems = localStorage.getItem('lostFoundItems');
        if (storedItems) {
          existingItems = JSON.parse(storedItems);
        }
      }

      // Update the item
      const updatedItems = existingItems.map(item => {
        if (item.id === id) {
          return {
            ...item,
            title: title.trim(),
            description: description.trim(),
            category,
            location: location.trim(),
            contactInfo: contactInfo.trim(),
            ...(imageUri && { imageUri }),
            ...(coordinates && { 
              latitude: coordinates.latitude, 
              longitude: coordinates.longitude 
            }),
          };
        }
        return item;
      });

      // Save to storage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('lostFoundItems', JSON.stringify(updatedItems));
      }

      console.log('Updated item:', id);
      
      Alert.alert(
        'Success',
        'Item has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 20 }}>
        <Text style={commonStyles.title}>Edit Item</Text>
        <Text style={commonStyles.text}>Update item information</Text>

        {/* Category Selection */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              category === 'lost' && styles.categoryButtonActive
            ]}
            onPress={() => setCategory('lost')}
          >
            <Text style={[
              styles.categoryButtonText,
              category === 'lost' && styles.categoryButtonTextActive
            ]}>
              Lost Item
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              category === 'found' && styles.categoryButtonActive
            ]}
            onPress={() => setCategory('found')}
          >
            <Text style={[
              styles.categoryButtonText,
              category === 'found' && styles.categoryButtonTextActive
            ]}>
              Found Item
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title Input */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Black iPhone 13, Blue backpack..."
          placeholderTextColor={colors.grey}
          maxLength={100}
        />

        {/* Description Input */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Provide detailed description including color, brand, distinctive features..."
          placeholderTextColor={colors.grey}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        {/* Image Upload Section */}
        <Text style={styles.label}>Photo (Optional)</Text>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <Icon name="close-circle" size={24} style={{ color: colors.error }} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imageUploadButton} onPress={showImageOptions}>
            <Icon name="camera-outline" size={32} style={{ color: colors.primary }} />
            <Text style={styles.imageUploadText}>Add Photo</Text>
            <Text style={styles.imageUploadSubtext}>Tap to take photo or choose from library</Text>
          </TouchableOpacity>
        )}

        {/* Location Input */}
        <Text style={styles.label}>Location *</Text>
        <View style={styles.locationContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Where was it lost/found?"
            placeholderTextColor={colors.grey}
            maxLength={200}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={loadingLocation}
          >
            <Icon 
              name={loadingLocation ? "refresh-outline" : "location-outline"} 
              size={20} 
              style={{ color: colors.primary }} 
            />
          </TouchableOpacity>
        </View>
        {Platform.OS === 'web' && (
          <Text style={styles.webLocationNote}>
            Note: Maps are not supported on web. Location coordinates will be stored but not displayed on map.
          </Text>
        )}

        {/* Contact Info Input */}
        <Text style={styles.label}>Contact Information *</Text>
        <TextInput
          style={styles.input}
          value={contactInfo}
          onChangeText={setContactInfo}
          placeholder="Email or phone number"
          placeholderTextColor={colors.grey}
          maxLength={100}
        />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            text="Update Item"
            onPress={handleUpdate}
            style={buttonStyles.instructionsButton}
          />
          <Button
            text="Cancel"
            onPress={() => router.back()}
            style={[buttonStyles.backButton, { marginTop: 10 }]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.grey + '50',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  categoryContainer: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 10,
  },
  categoryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.grey + '50',
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center' as const,
  },
  categoryButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey,
  },
  categoryButtonTextActive: {
    color: colors.text,
  },
  imageContainer: {
    position: 'relative' as const,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  imageUploadButton: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.grey + '50',
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderRadius: 8,
    padding: 30,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 10,
  },
  imageUploadSubtext: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 5,
    textAlign: 'center' as const,
  },
  locationContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  locationButton: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.grey + '50',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  webLocationNote: {
    fontSize: 12,
    color: colors.grey,
    fontStyle: 'italic' as const,
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
};