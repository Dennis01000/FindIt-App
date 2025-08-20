import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { colors, commonStyles } from '../styles/commonStyles';
import Icon from './Icon';
import type { LostFoundItem } from '../app/index';

interface ItemCardProps {
  item: LostFoundItem;
  onEdit: () => void;
  onDelete: () => void;
  onMarkResolved: () => void;
}

export default function ItemCard({ item, onEdit, onDelete, onMarkResolved }: ItemCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    return category === 'lost' ? '#ff6b6b' : '#51cf66';
  };

  const getStatusColor = (status: string) => {
    return status === 'resolved' ? '#51cf66' : '#ffd43b';
  };

  const openLocationInMaps = () => {
    if (item.latitude && item.longitude && Platform.OS !== 'web') {
      const url = Platform.select({
        ios: `maps:0,0?q=${item.latitude},${item.longitude}`,
        android: `geo:0,0?q=${item.latitude},${item.longitude}`,
      });
      
      if (url) {
        console.log('Opening location in maps:', url);
        // In a real app, you would use Linking.openURL(url)
      }
    }
  };

  return (
    <View style={[commonStyles.card, item.status === 'resolved' && styles.resolvedCard]}>
      {/* Header with category and status */}
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: item.status === 'resolved' ? '#fff' : '#000' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Item Image */}
      {item.imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
        </View>
      )}

      {/* Item Details */}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      
      <TouchableOpacity style={styles.detailRow} onPress={openLocationInMaps}>
        <Icon name="location-outline" size={16} style={{ marginRight: 5 }} />
        <Text style={[styles.detailText, item.latitude && item.longitude && Platform.OS !== 'web' && styles.linkText]}>
          {item.location}
        </Text>
        {item.latitude && item.longitude && Platform.OS !== 'web' && (
          <Icon name="open-outline" size={14} style={{ marginLeft: 5, color: colors.primary }} />
        )}
      </TouchableOpacity>
      
      {Platform.OS === 'web' && item.latitude && item.longitude && (
        <View style={styles.coordinatesRow}>
          <Icon name="navigate-outline" size={16} style={{ marginRight: 5 }} />
          <Text style={styles.coordinatesText}>
            Coordinates: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>
        </View>
      )}
      
      <View style={styles.detailRow}>
        <Icon name="calendar-outline" size={16} style={{ marginRight: 5 }} />
        <Text style={styles.detailText}>Reported: {formatDate(item.dateReported)}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Icon name="call-outline" size={16} style={{ marginRight: 5 }} />
        <Text style={styles.detailText}>{item.contactInfo}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Icon name="create-outline" size={20} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        {item.status === 'active' && (
          <TouchableOpacity style={[styles.actionButton, styles.resolveButton]} onPress={onMarkResolved}>
            <Icon name="checkmark-circle-outline" size={20} />
            <Text style={styles.actionButtonText}>Resolve</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <Icon name="trash-outline" size={20} />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    marginBottom: 12,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.grey,
    flex: 1,
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.grey,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.grey + '30',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  resolveButton: {
    backgroundColor: '#51cf66',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  resolvedCard: {
    opacity: 0.7,
    borderColor: '#51cf66',
  },
});