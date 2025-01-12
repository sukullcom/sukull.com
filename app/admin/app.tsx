"use client"

import { Admin, Resource } from "react-admin"
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

const dataProvider = simpleRestProvider("/api")

const App = () => {
    return (
        <Admin dataProvider={dataProvider}>
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
                edit={ChallengeOptionCreate}
                recordRepresentation="text"
                options={{ label: "Challenge Options" }}
            />
        </Admin>
    )
}

export default App