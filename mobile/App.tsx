import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { api, Loan, Summary } from './src/api';

const COLORS = {
  ink: '#172033', muted: '#6D778B', primary: '#3157D5', bg: '#F5F7FB',
  card: '#FFFFFF', line: '#E7EAF1', red: '#B42318', redBg: '#FFF0EE',
  green: '#16794B', greenBg: '#EAF8F0', paleBlue: '#EAF0FF',
};

const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const isOverdue = (loan: Loan) => !loan.repaidAt && loan.dueDate < today();

function PrimaryButton({ title, onPress, disabled = false, secondary = false }: {
  title: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabledButton]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
    </TouchableOpacity>
  );
}

function LoginScreen({ onLogin }: { onLogin: (token: string, phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sendOtp = async () => {
    setError('');
    if (!/^\+?[1-9]\d{9,14}$/.test(phone.trim())) return setError('Enter a valid phone number (10–15 digits).');
    setBusy(true);
    try { await api.requestOtp(phone.trim()); setSent(true); Alert.alert('OTP requested', 'Check the backend terminal for your demo OTP.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not request OTP.'); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    setError('');
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP printed in the server terminal.');
    setBusy(true);
    try { const result = await api.verifyOtp(phone.trim(), otp); onLogin(result.token, result.user.phone); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not verify OTP.'); }
    finally { setBusy(false); }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
        <Text style={styles.eyebrow}>PERSONAL IOU TRACKER</Text>
        <Text style={styles.heroTitle}>Money between{ '\n' }friends, made clear.</Text>
        <Text style={styles.subtitle}>Keep every loan in one simple place. Know what is due and what has been repaid.</Text>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Welcome to MiniLedger</Text>
          <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="+91 9876543210"
            placeholderTextColor="#A0A8B8" keyboardType="phone-pad" autoCapitalize="none"
            style={styles.input} editable={!sent} maxLength={16} />
          {sent && <>
            <Text style={styles.fieldLabel}>6-DIGIT OTP</Text>
            <TextInput value={otp} onChangeText={setOtp} placeholder="Enter code from server log"
              placeholderTextColor="#A0A8B8" keyboardType="number-pad" maxLength={6} style={styles.input} />
            <Text style={styles.helper}>Demo mode: the OTP is printed in the backend terminal.</Text>
          </>}
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          {busy ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} /> :
            <PrimaryButton title={sent ? 'Verify & sign in' : 'Send demo OTP'} onPress={sent ? verify : sendOtp} />}
          {sent && <PrimaryButton title="Use another number" secondary onPress={() => { setSent(false); setOtp(''); setError(''); }} />}
        </View>
        <Text style={styles.footerNote}>A simple demo app · No SMS is sent</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ summary }: { summary: Summary | null }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View><Text style={styles.summaryLabel}>TOTAL LENT</Text><Text style={styles.totalValue}>{money(summary?.totalLent || 0)}</Text></View>
        <View style={styles.summaryIcon}><Text style={styles.summaryIconText}>↗</Text></View>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryBottom}>
        <View style={styles.summaryMetric}><Text style={styles.metricLabel}>Repaid</Text><Text style={styles.metricValue}>{money(summary?.totalRepaid || 0)}</Text></View>
        <View style={styles.metricVerticalLine} />
        <View style={styles.summaryMetric}><Text style={styles.metricLabel}>Overdue</Text><Text style={[styles.metricValue, { color: (summary?.overdueAmount || 0) > 0 ? COLORS.red : COLORS.ink }]}>{money(summary?.overdueAmount || 0)}</Text></View>
      </View>
    </View>
  );
}

function LoanCard({ loan, onRepay, busy }: { loan: Loan; onRepay: (loan: Loan) => void; busy: boolean }) {
  const overdue = isOverdue(loan);
  const repaid = Boolean(loan.repaidAt);
  return (
    <View style={[styles.loanCard, overdue && styles.overdueCard]}>
      <View style={styles.loanTop}>
        <View style={[styles.avatar, overdue && styles.overdueAvatar]}><Text style={[styles.avatarText, overdue && { color: COLORS.red }]}>{loan.friendName.trim().charAt(0).toUpperCase()}</Text></View>
        <View style={styles.loanNameBlock}>
          <Text style={styles.friendName}>{loan.friendName}</Text>
          <Text style={styles.dueText}>Due {loan.dueDate}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.loanAmount}>{money(loan.amount)}</Text>
          <View style={[styles.statusPill, repaid ? styles.repaidPill : overdue ? styles.overduePill : styles.pendingPill]}>
            <Text style={[styles.statusText, repaid ? { color: COLORS.green } : overdue ? { color: COLORS.red } : { color: COLORS.primary }]}>
              {repaid ? 'REPAID' : overdue ? 'OVERDUE' : 'PENDING'}
            </Text>
          </View>
        </View>
      </View>
      {!repaid && <TouchableOpacity accessibilityRole="button" style={styles.repayButton} onPress={() => onRepay(loan)} disabled={busy}>
        <Text style={styles.repayButtonText}>{busy ? 'Updating…' : '✓  Mark as repaid'}</Text>
      </TouchableOpacity>}
    </View>
  );
}

function AddLoanForm({ token, onCreated, onCancel }: { token: string; onCreated: () => void; onCancel: () => void }) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setError('');
    const numericAmount = Number(amount);
    if (!friendName.trim()) return setError('Enter your friend’s name.');
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError('Amount must be greater than zero.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(new Date(`${dueDate}T00:00:00`).getTime())) return setError('Use a valid date in YYYY-MM-DD format.');
    setBusy(true);
    try { await api.createLoan(token, { friendName: friendName.trim(), amount: numericAmount, dueDate }); onCreated(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save this loan.'); }
    finally { setBusy(false); }
  };
  return (
    <View style={styles.formCard}>
      <View style={styles.formHeader}><Text style={styles.sectionTitle}>Add a loan</Text><TouchableOpacity onPress={onCancel}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity></View>
      <Text style={styles.fieldLabel}>FRIEND'S NAME</Text>
      <TextInput value={friendName} onChangeText={setFriendName} placeholder="e.g. Aarav Sharma" placeholderTextColor="#A0A8B8" style={styles.input} maxLength={80} />
      <Text style={styles.fieldLabel}>AMOUNT (₹)</Text>
      <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#A0A8B8" keyboardType="decimal-pad" style={styles.input} />
      <Text style={styles.fieldLabel}>DUE DATE (YYYY-MM-DD)</Text>
      <TextInput value={dueDate} onChangeText={setDueDate} placeholder="2026-11-15" placeholderTextColor="#A0A8B8" style={styles.input} maxLength={10} />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      <PrimaryButton title={busy ? 'Saving…' : 'Save loan'} onPress={submit} disabled={busy} />
    </View>
  );
}

function Dashboard({ token, phone, onLogout }: { token: string; phone: string; onLogout: () => void }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [loanData, summaryData] = await Promise.all([api.getLoans(token), api.getSummary(token)]);
      setLoans(loanData.loans); setSummary(summaryData);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load your ledger.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const orderedLoans = useMemo(() => [...loans].sort((a, b) => {
    if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1;
    if (Boolean(a.repaidAt) !== Boolean(b.repaidAt)) return a.repaidAt ? 1 : -1;
    return b.dueDate.localeCompare(a.dueDate);
  }), [loans]);
  const repay = (loan: Loan) => Alert.alert('Mark as repaid?', `Confirm that ${money(loan.amount)} from ${loan.friendName} has been repaid.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm repayment', onPress: async () => {
      setBusyId(loan.id);
      try { await api.repayLoan(token, loan.id); await load(); }
      catch (e) { Alert.alert('Could not update loan', e instanceof Error ? e.message : 'Please try again.'); }
      finally { setBusyId(null); }
    } },
  ]);
  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <View style={styles.topBar}>
        <View style={styles.brandRow}><View style={styles.smallBrandMark}><Text style={styles.smallBrandMarkText}>M</Text></View><Text style={styles.brandName}>MiniLedger</Text></View>
        <TouchableOpacity onPress={onLogout}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
      </View>
      <FlatList data={orderedLoans} keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.dashboardContent}
        ListHeaderComponent={<>
          <Text style={styles.greeting}>Your money, in order.</Text>
          <Text style={styles.welcomeSub}>Signed in as {phone}</Text>
          <SummaryCard summary={summary} />
          <View style={styles.listHeader}><View><Text style={styles.sectionTitle}>Your loans</Text><Text style={styles.listSub}>{loans.length} {loans.length === 1 ? 'entry' : 'entries'} tracked</Text></View>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}><Text style={styles.addButtonText}>{showForm ? '× Close' : '+ Add loan'}</Text></TouchableOpacity>
          </View>
          {showForm && <AddLoanForm token={token} onCancel={() => setShowForm(false)} onCreated={async () => { setShowForm(false); setLoading(true); await load(); }} />}
          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><PrimaryButton title="Try again" secondary onPress={() => { setLoading(true); void load(); }} /></View>}
          {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />}
          {!loading && orderedLoans.length === 0 && !error && <View style={styles.emptyState}><Text style={styles.emptyIcon}>↗</Text><Text style={styles.emptyTitle}>Your ledger starts here</Text><Text style={styles.emptyText}>Add your first loan to keep track of who owes you and when it's due.</Text><PrimaryButton title="+ Add your first loan" onPress={() => setShowForm(true)} /></View>}
        </>}
        renderItem={({ item }) => <LoanCard loan={item} onRepay={repay} busy={busyId === item.id} />}
        ListFooterComponent={<Text style={styles.bottomNote}>MiniLedger · Keep it clear, keep it friendly.</Text>}
        onRefresh={() => { setLoading(true); void load(); }} refreshing={loading} />
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState<{ token: string; phone: string } | null>(null);
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
    {session
      ? <Dashboard token={session.token} phone={session.phone} onLogout={() => setSession(null)} />
      : <LoginScreen onLogin={(token, phone) => setSession({ token, phone })} />}
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  loginContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brandMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 28, shadowColor: COLORS.primary, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  brandMarkText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  heroTitle: { color: COLORS.ink, fontSize: 34, fontWeight: '800', lineHeight: 41, letterSpacing: -0.8 },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 23, marginTop: 14, marginBottom: 28 },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: COLORS.line, shadowColor: '#23345D', shadowOpacity: 0.05, shadowRadius: 18, elevation: 2 },
  sectionTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '800' },
  fieldLabel: { color: COLORS.muted, fontSize: 10, letterSpacing: 1.3, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: '#FBFCFE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: COLORS.ink, fontSize: 15 },
  helper: { color: COLORS.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryButton: { backgroundColor: COLORS.paleBlue },
  secondaryButtonText: { color: COLORS.primary },
  disabledButton: { opacity: 0.55 },
  errorText: { color: COLORS.red, fontSize: 12, marginTop: 10, lineHeight: 17 },
  footerNote: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 22 },
  topBar: { paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: COLORS.bg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  smallBrandMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  smallBrandMarkText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  brandName: { color: COLORS.ink, fontSize: 17, fontWeight: '800' },
  logoutText: { color: COLORS.muted, fontSize: 13, fontWeight: '700' },
  dashboardContent: { padding: 20, paddingBottom: 32 },
  greeting: { color: COLORS.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 10 },
  welcomeSub: { color: COLORS.muted, fontSize: 12, marginTop: 6 },
  summaryCard: { marginTop: 22, backgroundColor: COLORS.ink, borderRadius: 22, padding: 20, shadowColor: COLORS.ink, shadowOpacity: 0.16, shadowRadius: 16, elevation: 4 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { color: '#B7C2DE', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 7, letterSpacing: -0.6 },
  summaryIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#33446B', alignItems: 'center', justifyContent: 'center' },
  summaryIconText: { color: '#C9D5FF', fontSize: 22, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: '#35405B', marginVertical: 18 },
  summaryBottom: { flexDirection: 'row', alignItems: 'center' },
  summaryMetric: { flex: 1 },
  metricLabel: { color: '#B7C2DE', fontSize: 12 },
  metricValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 5 },
  metricVerticalLine: { width: 1, height: 34, backgroundColor: '#35405B', marginHorizontal: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  listSub: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  addButton: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 11 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  loanCard: { backgroundColor: COLORS.card, borderRadius: 17, padding: 15, marginBottom: 11, borderWidth: 1, borderColor: COLORS.line },
  overdueCard: { borderColor: '#F2B7B1', backgroundColor: '#FFFBFA' },
  loanTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.paleBlue, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  overdueAvatar: { backgroundColor: COLORS.redBg },
  avatarText: { color: COLORS.primary, fontSize: 17, fontWeight: '800' },
  loanNameBlock: { flex: 1 },
  friendName: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  dueText: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  loanAmount: { color: COLORS.ink, fontSize: 15, fontWeight: '800' },
  statusPill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  repaidPill: { backgroundColor: COLORS.greenBg },
  overduePill: { backgroundColor: COLORS.redBg },
  pendingPill: { backgroundColor: COLORS.paleBlue },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  repayButton: { borderTopWidth: 1, borderTopColor: COLORS.line, marginTop: 14, paddingTop: 12 },
  repayButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  formCard: { backgroundColor: COLORS.card, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: COLORS.line },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeText: { color: COLORS.muted, fontWeight: '700', fontSize: 12 },
  emptyState: { backgroundColor: COLORS.card, borderRadius: 18, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line, marginTop: 4 },
  emptyIcon: { color: COLORS.primary, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  emptyTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800' },
  emptyText: { color: COLORS.muted, textAlign: 'center', fontSize: 12, lineHeight: 19, marginTop: 8 },
  bottomNote: { textAlign: 'center', color: '#9AA3B3', fontSize: 11, marginTop: 18, marginBottom: 8 },
  errorBox: { padding: 14, backgroundColor: COLORS.redBg, borderRadius: 12, marginVertical: 10 },
});
