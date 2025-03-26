import { 
    Datagrid, 
    List, 
    NumberField, 
    ReferenceField, 
    TextField, 
    TextInput,
    ReferenceInput,
    FilterList,
    FilterListItem,
    FilterLiveSearch,
    Pagination,
    useRecordContext
} from "react-admin";
import { Card, CardContent } from "@mui/material";
import { memo } from "react";
import BookIcon from '@mui/icons-material/Book';

// Custom filter sidebar for lessons
const LessonFilterSidebar = () => (
    <Card sx={{ order: -1, mr: 2, mt: 9, width: 250 }}>
        <CardContent>
            <FilterLiveSearch source="title" label="Search Title" />
            <FilterList label="Sort Order" icon={<BookIcon />}>
                <FilterListItem label="Ascending" value={{ order_sort: 'ASC' }} />
                <FilterListItem label="Descending" value={{ order_sort: 'DESC' }} />
            </FilterList>
        </CardContent>
    </Card>
);

// Memoized components to prevent unnecessary re-renders
const LessonTitle = memo(() => {
    const record = useRecordContext();
    return <span>{record?.title || ''}</span>;
});
LessonTitle.displayName = 'LessonTitle';

const UnitReference = memo(() => {
    const record = useRecordContext();
    return record ? (
        <ReferenceField source="unitId" reference="units" />
    ) : null;
});
UnitReference.displayName = 'UnitReference';

// Custom pagination component with smaller page sizes
const LessonPagination = () => <Pagination rowsPerPageOptions={[5, 10, 25]} />;

// Filter component for advanced filtering
const lessonFilters = [
    <TextInput key="title" source="title" label="Title" alwaysOn />,
    <ReferenceInput key="unitId" source="unitId" reference="units" label="Unit" />
];

export const LessonList = () => (
    <List 
        filters={lessonFilters}
        aside={<LessonFilterSidebar />}
        pagination={<LessonPagination />}
        perPage={10}
        sort={{ field: 'order', order: 'ASC' }}
    >
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="title" component={LessonTitle} />
            <UnitReference />
            <NumberField source="order" />
        </Datagrid>
    </List>
);