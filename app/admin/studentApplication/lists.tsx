import { 
  Datagrid, 
  List, 
  TextField, 
  DateField,
  TextInput,
  FilterList,
  FilterListItem,
  FilterLiveSearch,
  Pagination,
  useRecordContext,
  Button,
  useNotify,
  useRefresh
} from "react-admin";
import { Card, CardContent } from "@mui/material";
import { memo, useEffect } from "react";
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Add this interface at the top of the file
interface StudentApplication {
  id: string | number;
  studentName?: string;
  field?: string;
  studentEmail?: string;
  studentPhoneNumber?: string;
  priceRange?: string;
  studentNeeds?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  // Add other properties as needed
}

// Custom filter sidebar for student applications
const StudentApplicationFilterSidebar = () => (
  <Card sx={{ order: -1, mr: 2, mt: 9, width: 250 }}>
    <CardContent>
      <FilterLiveSearch source="studentName" label="Search Name" />
      <FilterList label="Status" icon={<PersonIcon />}>
        <FilterListItem label="Pending" value={{ status: "pending" }} />
        <FilterListItem label="Approved" value={{ status: "approved" }} />
        <FilterListItem label="Rejected" value={{ status: "rejected" }} />
      </FilterList>
      <FilterList label="Field" icon={<PersonIcon />}>
        <FilterListItem label="English" value={{ field: "English" }} />
        <FilterListItem label="Mathematics" value={{ field: "Mathematics" }} />
        <FilterListItem label="Physics" value={{ field: "Physics" }} />
        <FilterListItem label="Chess" value={{ field: "Chess" }} />
      </FilterList>
    </CardContent>
  </Card>
);

// Memoized components to prevent unnecessary re-renders
const StudentName = memo(() => {
  const record = useRecordContext();
  return <span>{record?.studentName || ''} {record?.studentSurname || ''}</span>;
});
StudentName.displayName = 'StudentName';

// Debug component to show the record status
const StatusDebug = () => {
  const record = useRecordContext();
  useEffect(() => {
    if (record) {
      console.log("Application record:", record);
      console.log("Status:", record.status);
    }
  }, [record]);
  return <span>{record?.status || 'unknown'}</span>;
};

// Custom action buttons for approving or rejecting applications
const ApproveButton = ({ record }: { record?: StudentApplication }) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const fullRecord = useRecordContext<StudentApplication>();
  
  // Use the record from context if not provided via props
  const application = record || fullRecord;
  
  const handleApprove = async () => {
    if (!application || !application.id) {
      notify('Cannot approve application: Application ID is missing', { type: 'error' });
      return;
    }
    
    try {
      console.log("Approving application:", application.id);
      const response = await fetch(`/api/admin/student-applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      
      if (response.ok) {
        notify('Application approved successfully', { type: 'success' });
        refresh();
      } else {
        notify('Error approving application', { type: 'error' });
      }
    } catch (error) {
      notify('Error approving application', { type: 'error' });
    }
  };
  
  // Determine button appearance based on status
  const isApproved = application?.status === 'approved';
  const buttonLabel = isApproved ? "Approved" : "Approve";
  const buttonColor = isApproved ? "success" : "primary";
  
  return (
    <Button
      label={buttonLabel}
      onClick={handleApprove}
      color={buttonColor}
      variant={isApproved ? "outlined" : "contained"}
      startIcon={<CheckCircleIcon />}
      disabled={isApproved}
      title={isApproved ? "This application is already approved" : "Approve this application"}
    />
  );
};

const RejectButton = ({ record }: { record?: StudentApplication }) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const fullRecord = useRecordContext<StudentApplication>();
  
  // Use the record from context if not provided via props
  const application = record || fullRecord;
  
  const handleReject = async () => {
    if (!application || !application.id) {
      notify('Cannot reject application: Application ID is missing', { type: 'error' });
      return;
    }
    
    try {
      console.log("Rejecting application:", application.id);
      const response = await fetch(`/api/admin/student-applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });
      
      if (response.ok) {
        notify('Application rejected successfully', { type: 'success' });
        refresh();
      } else {
        notify('Error rejecting application', { type: 'error' });
      }
    } catch (error) {
      notify('Error rejecting application', { type: 'error' });
    }
  };
  
  // Determine button appearance based on status
  const isRejected = application?.status === 'rejected';
  const buttonLabel = isRejected ? "Rejected" : "Reject";
  const buttonColor = isRejected ? "error" : "error";
  
  return (
    <Button
      label={buttonLabel}
      onClick={handleReject}
      color={buttonColor}
      variant={isRejected ? "outlined" : "contained"}
      startIcon={<CancelIcon />}
      disabled={isRejected}
      title={isRejected ? "This application is already rejected" : "Reject this application"}
    />
  );
};

// Custom pagination component with smaller page sizes
const ApplicationPagination = () => <Pagination rowsPerPageOptions={[5, 10, 25]} />;

// Filter component for advanced filtering
const studentApplicationFilters = [
  <TextInput key="studentName" source="studentName" label="Name" alwaysOn />,
  <TextInput key="field" source="field" label="Field" />,
];

export const StudentApplicationList = () => {
  return (
    <List 
      filters={studentApplicationFilters}
      aside={<StudentApplicationFilterSidebar />}
      pagination={<ApplicationPagination />}
      perPage={10}
      sort={{ field: 'createdAt', order: 'DESC' }}
    >
      <Datagrid bulkActionButtons={false}>
        <TextField source="id" />
        <TextField source="studentName" label="Name" component={StudentName} />
        <TextField source="field" />
        <TextField source="studentEmail" label="Email" />
        <TextField source="studentPhoneNumber" label="Phone" />
        <TextField source="priceRange" label="Price Range" />
        <TextField source="studentNeeds" label="Needs" />
        <TextField source="status" component={StatusDebug} />
        <DateField source="createdAt" label="Applied" />
        <ApproveButton />
        <RejectButton />
      </Datagrid>
    </List>
  );
}; 