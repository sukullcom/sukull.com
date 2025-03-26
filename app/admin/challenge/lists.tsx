import { 
    Datagrid, 
    List, 
    NumberField, 
    ReferenceField, 
    TextField, 
    SelectField,
    TextInput,
    ReferenceInput,
    SelectInput,
    FilterList,
    FilterListItem,
    FilterLiveSearch,
    Pagination,
    useRecordContext
} from "react-admin";
import { Card, CardContent } from "@mui/material";
import { memo } from "react";
import CategoryIcon from '@mui/icons-material/Category';

// Custom filter sidebar for challenges
const ChallengeFilterSidebar = () => (
    <Card sx={{ order: -1, mr: 2, mt: 9, width: 250 }}>
        <CardContent>
            <FilterLiveSearch source="question" label="Search Question" />
            <FilterList label="Challenge Type" icon={<CategoryIcon />}>
                <FilterListItem label="Select" value={{ type: "SELECT" }} />
                <FilterListItem label="Assist" value={{ type: "ASSIST" }} />
            </FilterList>
        </CardContent>
    </Card>
);

// Memoized components to prevent unnecessary re-renders
const ChallengeQuestion = memo(() => {
    const record = useRecordContext();
    return <span>{record?.question || ''}</span>;
});
ChallengeQuestion.displayName = 'ChallengeQuestion';

const LessonReference = memo(() => {
    const record = useRecordContext();
    return record ? (
        <ReferenceField source="lessonId" reference="lessons" />
    ) : null;
});
LessonReference.displayName = 'LessonReference';

// Custom pagination component with smaller page sizes
const ChallengePagination = () => <Pagination rowsPerPageOptions={[5, 10, 25]} />;

// Filter component for advanced filtering
const challengeFilters = [
    <TextInput key="question-filter" source="question" label="Search" alwaysOn />,
    <SelectInput 
        key="type-filter"
        source="type" 
        label="Type" 
        choices={[
            { id: "SELECT", name: "Select" },
            { id: "ASSIST", name: "Assist" }
        ]} 
    />,
    <ReferenceInput key="lesson-filter" source="lessonId" reference="lessons" label="Lesson" />
];

export const ChallengeList = () => (
    <List 
        filters={challengeFilters}
        aside={<ChallengeFilterSidebar />}
        pagination={<ChallengePagination />}
        perPage={10}
        sort={{ field: 'id', order: 'DESC' }}
    >
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="question" component={ChallengeQuestion} />
            <SelectField 
                source="type"
                choices={[
                    { id: "SELECT", name: "Select" },
                    { id: "ASSIST", name: "Assist" }
                ]}
            />
            <LessonReference />
            <NumberField source="order" />
        </Datagrid>
    </List>
);