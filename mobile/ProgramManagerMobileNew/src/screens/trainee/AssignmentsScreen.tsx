import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert,
  Dimensions,
  Platform 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme, 
  ActivityIndicator,
  Chip,
  Surface,
  Dialog,
  Portal,
  TextInput,
  Divider,
  FAB,
  SegmentedButtons,
  List,
  IconButton,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

// Import services
import { assignmentService } from '../../services/assignment.service';
import { Assignment, Submission } from '../../types';
import ModernHeader from '../../components/ModernHeader';

const { width } = Dimensions.get('window');

export default function AssignmentsScreen() {
  const theme = useTheme();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Available Assignments Tab
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // My Submissions Tab
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState('available');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentsData, submissionsData] = await Promise.all([
        assignmentService.getMyAssignments(),
        assignmentService.getMySubmissions()
      ]);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);
      
      // Auto-select the first assignment if available
      if (assignmentsData.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(assignmentsData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
      Alert.alert('Error', 'Failed to load your assignments.');
    } finally {
      setLoading(false);
    }
  }, [selectedAssignmentId]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/zip', 'application/x-rar-compressed', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Error', 'Failed to pick file.');
    }
  };

  const handleSubmitProject = async () => {
    if (!selectedAssignmentId) {
      Alert.alert('Error', 'Please select an assignment to submit for.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await assignmentService.submitAssignment(selectedAssignmentId, {
        content: 'Project submission',
        files: [selectedFile]
      });
      
      Alert.alert('Success', 'Project submitted successfully!');
      setSelectedFile(null);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Failed to submit project:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOverallProjectStatus = (assignment: Assignment): string => {
    const submission = submissions.find(sub => 
      sub.assignment === assignment._id
    );
    if (!submission) {
      if (new Date(assignment.dueDate) < new Date()) {
        return 'Not Started';
      }
      return 'Pending Submission';
    }
    return submission.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return theme.colors.primary;
      case 'Reviewed': return theme.colors.primary;
      case 'NeedsRevision': return theme.colors.error;
      case 'Graded': return theme.colors.primary;
      case 'Not Started': return theme.colors.error;
      case 'Pending Submission': return theme.colors.outline;
      default: return theme.colors.outline;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Reviewed':
      case 'Graded':
        return 'check-circle';
      case 'NeedsRevision':
        return 'close-circle';
      case 'Not Started':
        return 'alert-circle';
      default:
        return 'clock-outline';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      const assignment = assignments.find(a => a._id === submission.assignment);
      const matchesSearch = searchTerm === '' ||
        (assignment?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, assignments, searchTerm, filterStatus]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading your assignments...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ModernHeader
          title="Project Submissions"
          subtitle="Submit your assignments for approved courses"
          icon="file-document-multiple"
          gradient={true}
        />

        {/* Tab Navigation */}
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'available', label: 'Available Assignments' },
            { value: 'submissions', label: 'My Submissions' }
          ]}
          style={styles.tabButtons}
        />

        {/* Available Assignments Tab */}
        {activeTab === 'available' && (
          <Card style={styles.card}>
            <Card.Title title="Assignments to Submit" />
            <Card.Content>
              {assignments.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="file-document-outline" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    No assignments currently available for submission.
                  </Text>
                </View>
              ) : (
                <View style={styles.assignmentSection}>
                  {/* Assignment Selection */}
                  <View style={styles.selectionSection}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
                      Select Assignment
                    </Text>
                    <View style={styles.dropdownContainer}>
                      <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                          <Surface style={styles.dropdownSurface} elevation={1}>
                            <Button
                              mode="text"
                              onPress={() => setMenuVisible(true)}
                              style={styles.dropdownButton}
                              contentStyle={styles.dropdownButtonContent}
                              labelStyle={styles.dropdownLabel}
                            >
                              {selectedAssignmentId 
                                ? assignments.find(a => a._id === selectedAssignmentId)?.title || 'Select an assignment...'
                                : 'Select an assignment to submit for...'
                              }
                            </Button>
                            <IconButton
                              icon="chevron-down"
                              size={20}
                              onPress={() => setMenuVisible(true)}
                              style={styles.dropdownIcon}
                            />
                          </Surface>
                        }
                      >
                        {assignments.map(assignment => (
                          <Menu.Item
                            key={assignment._id}
                            onPress={() => {
                              setSelectedAssignmentId(assignment._id);
                              setMenuVisible(false);
                            }}
                            title={`${assignment.title} (Due: ${formatDate(assignment.dueDate)})`}
                            leadingIcon="file-document"
                          />
                        ))}
                      </Menu>
                    </View>
                    
                    {selectedAssignmentId && (
                      <View style={styles.statusSection}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Status: 
                        </Text>
                        <Chip 
                          mode="flat" 
                          compact 
                          style={{ backgroundColor: getStatusColor(getOverallProjectStatus(assignments.find(a => a._id === selectedAssignmentId)!)) + '20' }}
                          textStyle={{ color: getStatusColor(getOverallProjectStatus(assignments.find(a => a._id === selectedAssignmentId)!)) }}
                        >
                          {getOverallProjectStatus(assignments.find(a => a._id === selectedAssignmentId)!)}
                        </Chip>
                      </View>
                    )}
                  </View>

                  {/* File Upload */}
                  <View style={styles.uploadSection}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
                      Project File
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={handleFilePick}
                      disabled={isSubmitting}
                      icon="file-upload"
                      style={styles.uploadButton}
                    >
                      {selectedFile ? 'Change File' : 'Select File'}
                    </Button>
                    {selectedFile && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        Selected: {selectedFile.name}
                      </Text>
                    )}
                  </View>

                  {/* Submit Button */}
                  <Button
                    mode="contained"
                    onPress={handleSubmitProject}
                    disabled={isSubmitting || !selectedAssignmentId || !selectedFile}
                    loading={isSubmitting}
                    style={styles.submitButton}
                  >
                    Submit Project
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* My Submissions Tab */}
        {activeTab === 'submissions' && (
          <Card style={styles.card}>
            <Card.Title title="My Past Submissions" />
            <Card.Content>
              {/* Search and Filter */}
              <View style={styles.filterSection}>
                <TextInput
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  style={styles.searchInput}
                  left={<TextInput.Icon icon="magnify" />}
                />
                <View style={styles.filterButtons}>
                  {['all', 'Submitted', 'Reviewed', 'NeedsRevision', 'Graded'].map(status => (
                    <Chip
                      key={status}
                      mode={filterStatus === status ? 'flat' : 'outlined'}
                      onPress={() => setFilterStatus(status)}
                      style={styles.filterChip}
                    >
                      {status === 'all' ? 'All' : status}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Submissions List */}
              {filteredSubmissions.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="file-document-outline" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    {searchTerm || filterStatus !== "all" 
                      ? "No submissions match your current filters."
                      : "You haven't submitted any projects yet."}
                  </Text>
                </View>
              ) : (
                <View style={styles.submissionsList}>
                  {filteredSubmissions.map(submission => {
                    const assignment = assignments.find(a => a._id === submission.assignment);
                    return (
                      <Surface key={submission._id} style={[styles.submissionCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <View style={styles.submissionHeader}>
                          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                            {assignment?.title || 'Unknown Assignment'}
                          </Text>
                          <Chip 
                            mode="flat" 
                            compact 
                            style={{ backgroundColor: getStatusColor(submission.status) + '20' }}
                            textStyle={{ color: getStatusColor(submission.status) }}
                            icon={getStatusIcon(submission.status)}
                          >
                            {submission.status}
                          </Chip>
                        </View>
                        
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                          Submitted: {formatDate(submission.submittedAt)}
                        </Text>
                        
                        {submission.feedback && (
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, fontStyle: 'italic' }}>
                            Feedback: {submission.feedback}
                          </Text>
                        )}
                        
                        {submission.marks && (
                          <View style={styles.gradeSection}>
                            <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                              Grade: {submission.marks}%
                            </Text>
                          </View>
                        )}
                      </Surface>
                    );
                  })}
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  tabButtons: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
  },
  assignmentSection: {
    padding: 20,
  },
  selectionSection: {
    marginBottom: 16,
  },
  dropdownContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownSurface: {
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownLabel: {
    fontSize: 16,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  statusSection: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadButton: {
    borderRadius: 12,
  },
  submitButton: {
    borderRadius: 12,
  },
  filterSection: {
    marginBottom: 10,
  },
  searchInput: {
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
  },
  submissionsList: {
    gap: 10,
  },
  submissionCard: {
    borderRadius: 16,
    padding: 15,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
});