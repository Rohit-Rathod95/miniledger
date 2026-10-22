import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSummary, listLoans, markRepaid } from '../api/loans';
import { useAuth } from '../context/AuthContext';
import type { Loan, RootStackParamList, Summary } from '../types';

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { signOut } = useAuth();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repayingId, setRepayingId] = useState<string | null>(null);

  const isInitialMountRef = useRef(true);

  const loadData = useCallback(async (isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
    }
    setError(null);
    try {
      const [summaryRes, loansRes] = await Promise.all([
        getSummary(),
        listLoans(),
      ]);
      setSummary(summaryRes);
      setLoans(loansRes);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const isFirst = isInitialMountRef.current;
      isInitialMountRef.current = false;
      loadData(isFirst);
    }, [loadData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  const handleMarkRepaid = async (id: string) => {
    try {
      setRepayingId(id);
      await markRepaid(id);
      await loadData(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to mark as repaid');
    } finally {
      setRepayingId(null);
    }
  };

  if (loading && !summary && loans.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (error && !summary && loans.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'bottom']}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadData(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryColumn}>
        <Text style={styles.summaryLabel}>Lent</Text>
        <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
          {currencyFormatter.format(summary?.totalLent ?? 0)}
        </Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryColumn}>
        <Text style={styles.summaryLabel}>Repaid</Text>
        <Text
          style={[styles.summaryValue, styles.repaidValue]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {currencyFormatter.format(summary?.totalRepaid ?? 0)}
        </Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryColumn}>
        <Text style={styles.summaryLabel}>Overdue</Text>
        <Text
          style={[styles.summaryValue, styles.overdueValue]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {currencyFormatter.format(summary?.overdueAmount ?? 0)}
        </Text>
      </View>
    </View>
  );

  const renderLoanItem = ({ item }: { item: Loan }) => {
    const isOverdue = !item.repaid && item.isOverdue;

    let badgeText = 'Due';
    let badgeStyle = styles.badgeDue;
    let badgeTextStyle = styles.badgeDueText;

    if (item.repaid) {
      badgeText = 'Repaid';
      badgeStyle = styles.badgeRepaid;
      badgeTextStyle = styles.badgeRepaidText;
    } else if (item.isOverdue) {
      badgeText = 'Overdue';
      badgeStyle = styles.badgeOverdue;
      badgeTextStyle = styles.badgeOverdueText;
    }

    return (
      <View
        style={[
          styles.loanRow,
          isOverdue && styles.overdueLoanRow,
        ]}
      >
        <View style={styles.loanContentRow}>
          {item.receiptUrl ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.receiptUrl!)}
              activeOpacity={0.8}
              style={styles.receiptThumbnailContainer}
              accessibilityRole="button"
              accessibilityLabel="View receipt photo"
            >
              <Image
                source={{ uri: item.receiptUrl }}
                style={styles.receiptThumbnail}
              />
            </TouchableOpacity>
          ) : null}

          <View style={styles.loanMainInfo}>
            <View style={styles.loanTopLine}>
              <Text style={styles.friendName}>{item.friendName}</Text>
              <Text style={styles.amountText}>
                {currencyFormatter.format(item.amount)}
              </Text>
            </View>

            <View style={styles.loanBottomLine}>
              <Text style={styles.dueDateText}>Due: {item.dueDate}</Text>
              <View style={[styles.badge, badgeStyle]}>
                <Text style={[styles.badgeText, badgeTextStyle]}>{badgeText}</Text>
              </View>
            </View>
          </View>
        </View>

        {!item.repaid && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.markRepaidButton,
                repayingId === item.id && styles.buttonDisabled,
              ]}
              onPress={() => handleMarkRepaid(item.id)}
              disabled={repayingId === item.id}
              activeOpacity={0.7}
            >
              {repayingId === item.id ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.markRepaidButtonText}>Mark repaid</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>MiniLedger</Text>
        <TouchableOpacity
          onPress={signOut}
          style={styles.logoutButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* 2 & 3. Summary card & FlatList */}
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        renderItem={renderLoanItem}
        ListHeaderComponent={renderSummaryCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No entries yet. Tap + to add one.
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* Floating "+" button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Add')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add entry"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  logoutText: {
    fontSize: 15,
    color: '#D32F2F',
    fontWeight: '600',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  repaidValue: {
    color: '#16A34A',
  },
  overdueValue: {
    color: '#DC2626',
  },
  listContent: {
    paddingBottom: 96,
  },
  loanRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  overdueLoanRow: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
    borderColor: '#FED7D7',
  },
  loanMainInfo: {
    flex: 1,
  },
  loanTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  friendName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  amountText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  loanBottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeRepaid: {
    backgroundColor: '#E6F4EA',
  },
  badgeRepaidText: {
    color: '#137333',
  },
  badgeOverdue: {
    backgroundColor: '#FCE8E6',
  },
  badgeOverdueText: {
    color: '#C5221F',
  },
  badgeDue: {
    backgroundColor: '#F1F3F4',
  },
  badgeDueText: {
    color: '#5F6368',
  },
  actionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  markRepaidButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  markRepaidButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
    marginTop: -2,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loanContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptThumbnailContainer: {
    marginRight: 12,
  },
  receiptThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
});
