"use client"

import { Admin, Resource, fetchUtils } from "react-admin"
import simpleRestProvider from "ra-data-simple-rest"
import { CourseList } from "./course/lists"
import { CourseCreate } from "./course/create"
import { CourseEdit } from "./course/edit"
import { UnitList } from "./unit/lists"
import { UnitCreate } from "./unit/create"
import { UnitEdit } from "./unit/edit"
import { LessonList } from "./lesson/lists"
import { LessonEdit } from "./lesson/edit"
import { LessonCreate } from "./lesson/create"
import { ChallengeList } from "./challenge/lists"
import { ChallengeCreate } from "./challenge/create"
import { ChallengeEdit } from "./challenge/edit"
import { ChallengeOptionList } from "./challengeOption/lists"
import { ChallengeOptionCreate } from "./challengeOption/create"
import { ChallengeOptionEdit } from "./challengeOption/edit"
import { defaultTheme } from 'react-admin';
import { TeacherApplicationList } from "./teacherApplication/lists";

// Create a custom HTTP client
const httpClient = (url: string, options: any = {}) => {
    // Initialize headers properly
    if (!options.headers) {
        options.headers = new Headers();
    } else if (!(options.headers instanceof Headers)) {
        // Convert object to Headers instance if it's not already
        const headers = new Headers();
        Object.entries(options.headers).forEach(([key, value]) => {
            if (typeof key === 'string' && typeof value === 'string') {
                headers.set(key, value);
            }
        });
        options.headers = headers;
    }
    
    // Add accept header safely
    options.headers.set('Accept', 'application/json');
    
    // Add CORS header safely
    options.headers.set('X-Requested-With', 'XMLHttpRequest');
    
    return fetchUtils.fetchJson(url, options);
};

// Get the base simpleRestProvider
const simpleProvider = simpleRestProvider("/api", httpClient);

// Create a custom dataProvider that handles errors gracefully
const dataProvider = {
    ...simpleProvider,
    // Override getList to handle errors better
    getList: (resource, params) => {
        return simpleProvider.getList(resource, params)
            .catch(error => {
                console.error(`Error in getList for ${resource}:`, error);
                return Promise.reject(error);
            });
    },
    // Override getOne to handle errors better
    getOne: (resource, params) => {
        return simpleProvider.getOne(resource, params)
            .catch(error => {
                console.error(`Error in getOne for ${resource}:`, error);
                return Promise.reject(error);
            });
    }
};

// Create a theme with a smaller pagination size
const theme = {
    ...defaultTheme,
    components: {
        ...defaultTheme.components,
        RaList: {
            defaultProps: {
                perPage: 10,
                exporter: false
            }
        },
        RaPaginationActions: {
            defaultProps: {
                rowsPerPageOptions: [5, 10, 25]
            }
        }
    }
};

const App = () => {
    return (
        <Admin 
            dataProvider={dataProvider} 
            theme={theme} 
            requireAuth
            disableTelemetry
        >
            <Resource
                name="courses"
                list={CourseList}
                create={CourseCreate}
                edit={CourseEdit}
                recordRepresentation="title"
            />
            <Resource
                name="units"
                list={UnitList}
                create={UnitCreate}
                edit={UnitEdit}
                recordRepresentation="title"
            />
            <Resource
                name="lessons"
                list={LessonList}
                create={LessonCreate}
                edit={LessonEdit}
                recordRepresentation="title"
            />
            <Resource
                name="challenges"
                list={ChallengeList}
                create={ChallengeCreate}
                edit={ChallengeEdit}
                recordRepresentation="question"
            />
            <Resource
                name="challengeOptions"
                list={ChallengeOptionList}
                create={ChallengeOptionCreate}
                edit={ChallengeOptionEdit}
                recordRepresentation="text"
                options={{ label: "Challenge Options" }}
            />
            <Resource
                name="teacherApplications"
                list={TeacherApplicationList}
                recordRepresentation="teacherName"
                options={{ label: "Teacher Applications" }}
            />
        </Admin>
    )
}

export default App