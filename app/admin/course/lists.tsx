import { 
    Datagrid,  
    List, 
    TextField,
    TextInput,
    FilterList,
    FilterListItem,
    FilterLiveSearch,
    Pagination,
    useRecordContext,
    ImageField
} from "react-admin";
import { Card, CardContent } from "@mui/material";
import { memo } from "react";
import ClassIcon from '@mui/icons-material/Class';

// Custom filter sidebar for courses
const CourseFilterSidebar = () => (
    <Card sx={{ order: -1, mr: 2, mt: 9, width: 250 }}>
        <CardContent>
            <FilterLiveSearch source="title" label="Search Title" />
            <FilterList label="Sort By" icon={<ClassIcon />}>
                <FilterListItem label="Title A-Z" value={{ sort: 'title', order: 'ASC' }} />
                <FilterListItem label="Title Z-A" value={{ sort: 'title', order: 'DESC' }} />
                <FilterListItem label="Newest" value={{ sort: 'id', order: 'DESC' }} />
                <FilterListItem label="Oldest" value={{ sort: 'id', order: 'ASC' }} />
            </FilterList>
        </CardContent>
    </Card>
);

// Memoized components to prevent unnecessary re-renders
const CourseTitle = memo(() => {
    const record = useRecordContext();
    return <span>{record?.title || ''}</span>;
});
CourseTitle.displayName = 'CourseTitle';

const CourseImage = memo(() => {
    const record = useRecordContext();
    return record?.imageSrc ? (
        <ImageField source="imageSrc" />
    ) : (
        <span>No image</span>
    );
});
CourseImage.displayName = 'CourseImage';

// Custom pagination component with smaller page sizes
const CoursePagination = () => <Pagination rowsPerPageOptions={[5, 10, 25]} />;

// Filter component for advanced filtering
const courseFilters = [
    <TextInput source="title" label="Title" alwaysOn />
];

export const CourseList = () => (
    <List 
        filters={courseFilters}
        aside={<CourseFilterSidebar />}
        pagination={<CoursePagination />}
        perPage={10}
        sort={{ field: 'title', order: 'ASC' }}
    >
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="title" component={CourseTitle} />
            <CourseImage />
        </Datagrid>
    </List>
);