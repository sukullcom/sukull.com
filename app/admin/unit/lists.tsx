import { 
    Datagrid,  
    List, 
    ReferenceField, 
    TextField,
    TextInput,
    ReferenceInput,
    FilterList,
    FilterListItem,
    FilterLiveSearch,
    Pagination,
    useRecordContext,
    NumberField
} from "react-admin";
import { Card, CardContent } from "@mui/material";
import { memo } from "react";
import SchoolIcon from '@mui/icons-material/School';

// Custom filter sidebar for units
const UnitFilterSidebar = () => (
    <Card sx={{ order: -1, mr: 2, mt: 9, width: 250 }}>
        <CardContent>
            <FilterLiveSearch source="title" label="Search Title" />
            <FilterList label="Sort Order" icon={<SchoolIcon />}>
                <FilterListItem label="Ascending" value={{ order_sort: 'ASC' }} />
                <FilterListItem label="Descending" value={{ order_sort: 'DESC' }} />
            </FilterList>
        </CardContent>
    </Card>
);

// Memoized components to prevent unnecessary re-renders
const UnitTitle = memo(() => {
    const record = useRecordContext();
    return <span>{record?.title || ''}</span>;
});
UnitTitle.displayName = 'UnitTitle';

const UnitDescription = memo(() => {
    const record = useRecordContext();
    return <span>{record?.description || ''}</span>;
});
UnitDescription.displayName = 'UnitDescription';

const CourseReference = memo(() => {
    const record = useRecordContext();
    return record ? (
        <ReferenceField source="courseId" reference="courses" />
    ) : null;
});
CourseReference.displayName = 'CourseReference';

// Custom pagination component with smaller page sizes
const UnitPagination = () => <Pagination rowsPerPageOptions={[5, 10, 25]} />;

// Filter component for advanced filtering
const unitFilters = [
    <TextInput key="title" source="title" label="Title" alwaysOn />,
    <TextInput key="description" source="description" label="Description" />,
    <ReferenceInput key="courseId" source="courseId" reference="courses" label="Course" />
];

export const UnitList = () => (
    <List 
        filters={unitFilters}
        aside={<UnitFilterSidebar />}
        pagination={<UnitPagination />}
        perPage={10}
        sort={{ field: 'order', order: 'ASC' }}
    >
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="title" component={UnitTitle} />
            <TextField source="description" component={UnitDescription} />
            <CourseReference />
            <NumberField source="order" />
        </Datagrid>
    </List>
);