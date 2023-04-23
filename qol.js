function logSchoologyAPIResponse(data) {
    if (data instanceof Error) {
        console.error(data)
    }
    else {
        console.log("Data:")
        console.info(data)
    }
}

function getCurrentSchoolYear() {
    const current_time = new Date();
    const current_month = current_time.getMonth();
    let school_year = current_time.getFullYear();
    if (current_month < 6) {
        school_year -= 1;
    }
    return Math.floor(new Date(Date.UTC(school_year, 7, 1)).valueOf() / 1000);
}

async function getUnenrolledGrades() {
    const course_titles = [];
    const course_grades = [];
    const background_js = browser.runtime;
    // Grabs current Schoology user API_UID to fetch grades from Schoology.
    const gradesObj = await background_js.sendMessage({type: "api", params: {method: "GET"}, url: 'https://api.schoology.com/v1/app-user-info'})
        .then((data) => data.api_uid)
        .then((api_uid) => background_js.sendMessage({type: "api", params: {method: "GET"}, url: `https://api.schoology.com/v1/users/${api_uid}/grades?timestamp=${getCurrentSchoolYear()}`}))
        .catch((error) => {
            console.error(`gradesObj Error: ${error}`);
            return error;
        });
    // Traverses gradesObj to get promise of the Course Title for the current course. 
    // Also gets the exact grade percentage from the current course.
    gradesObj.section.forEach((period) => {
        course_titles.push(background_js.sendMessage({type: "api", params: {method: "GET"}, url: `https://api.schoology.com/v1/sections/${period.section_id}`})
        .then((section) => section.course_title)
        .catch((error) => {
            console.error(error);
            return -1;
        }));
        course_grades.push(period.final_grade[period.final_grade.length - 1].grade);
    });
    // Waits for the course title promises to be fufilled.
    // Checks array for -1, so that bad entries can be deleted.
    // Returns an array of objects, where each object has the course title name, and the actual grade in percent.
    return Promise.all(course_titles)
        .then((courses) => {
            if (!courses.includes(-1)) {
                return courses;
            }
            else {
                for (let i = 0; i < courses.length; i++) {
                    if (courses[i] === -1) {
                        courses.splice(i, 1);
                        course_grades.splice(i, 1);
                    }
                }
                return courses;
            }
        })
        .then((courses) => courses.map((title, index) => ({"periodName": title, "periodGrade": course_grades[index]})))
        .catch((error) => {
            console.error(`course_title Fetch Error: ${error}`)
            return error;
        });
}

function addGrades(grades) {
    const div = document.getElementById("main-inner");

    if (grades instanceof Error) {
        div.insertAdjacentText("afterbegin", "Grades Failed To Load (some error occured; check console for details)")
    }
    
    const tableHeaderTemplate = `
        <thead>
            <tr>
                <th>Courses</th>
                <th>Grade</th>
            </tr>
        </thead>`
    const table = document.createElement("table");
    table.setAttribute("class", "qol");
    table.insertAdjacentHTML("afterbegin", tableHeaderTemplate);
    table.createTBody();

    grades.forEach((element) => {
        const newRow = table.insertRow();
        const newPeriodCell = newRow.insertCell();
        const newGradeCell = newRow.insertCell();

        newPeriodCell.textContent = `${element.periodName}`;
        newGradeCell.textContent = `${element.periodGrade}%`;
    });
    div.prepend(table)
}

function main() {
    document.body.style.border = "5px solid red";
    
    getUnenrolledGrades().then(addGrades)

}

main()




