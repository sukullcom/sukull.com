import { 
    Datagrid, 
    List, 
    NumberField, 
    ReferenceField, 
    TextField, 
    BooleanField,
    TextInput,
    ReferenceInput,
    FilterList,
    FilterListItem,
    FilterLiveSearch,
    BooleanInput,
    useRecordContext,
    Pagination
} from "react-admin";
import { Card, CardContent } from "@mui/material";
import { memo } from "react";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Custom filter sidebar for challenge options
const ChallengeOptionFilterSidebar = () => (
    <Card sx={{ order: -1, mr: 2, mt: 9, width: 250 }}>
        <CardContent>
            <FilterLiveSearch source="text" label="Search" />
            <FilterList label="Correct Answer" icon={<CheckCircleIcon />}>
                <FilterListItem label="Yes" value={{ correct: true }} />
                <FilterListItem label="No" value={{ correct: false }} />
            </FilterList>
        </CardContent>
    </Card>
);

// Memoized record fields to prevent performance issues
const ChallengeOptionText = memo(() => {
    const record = useRecordContext();
    return <span>{record?.text || ''}</span>;
});
ChallengeOptionText.displayName = 'ChallengeOptionText';

const ChallengeReference = memo(() => {
    const record = useRecordContext();
    return record ? (
        <ReferenceField source="challengeId" reference="challenges" />
    ) : null;
});
ChallengeReference.displayName = 'ChallengeReference';

// Custom pagination component with smaller page sizes
const PostPagination = () => <Pagination rowsPerPageOptions={[5, 10, 25]} />;

// Filter component for advanced filtering
const challengeOptionFilters = [
    <TextInput key="text" source="text" label="Search" alwaysOn />,
    <BooleanInput key="correct" source="correct" label="Correct" />,
    <ReferenceInput key="challengeId" source="challengeId" reference="challenges" label="Challenge" />,
];

export const ChallengeOptionList = () => (
    <List 
        filters={challengeOptionFilters}
        aside={<ChallengeOptionFilterSidebar />}
        pagination={<PostPagination />}
        perPage={10}
        sort={{ field: 'id', order: 'DESC' }}
    >
        <Datagrid rowClick="edit">
            <NumberField source="id" />
            <TextField source="text" component={ChallengeOptionText} />
            <BooleanField source="correct" />
            <ChallengeReference />
            <TextField source="imageSrc" emptyText="-" />
            <TextField source="audioSrc" emptyText="-" />
        </Datagrid>
    </List>
);