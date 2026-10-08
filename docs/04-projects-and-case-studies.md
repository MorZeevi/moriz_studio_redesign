# Projects and case studies

## Projects to appear on the website

The project owner has selected the following products for inclusion. Further details will be supplied later. The list does not establish presentation order or case study hierarchy.

| Project | Information supplied by the project owner | Further documentation |
| --- | --- | --- |
| practice ai learning system | A learning system for practice ai. | TODO: Decision required |
| Haaretz project | A project for the Haaretz newspaper; the owner-corrected project label is “וורדעל” (2026-10-07). Final project title: TODO: Decision required | TODO: Decision required |
| Chabad Club (חב״ד קלאב) | Project name supplied; no further description provided yet. | TODO: Decision required |

Earlier source correction, 2026-10-07: the owner corrected the earlier recorded label “וורגעל” to **לוורדעל**; that revision rendered **הארץ — לוורדעל**. This spelling correction does not approve all final project titles or Home selection/order.

Latest source correction, 2026-10-07: the owner corrected **לוורדעל** to **וורדעל**. The current shared render is **הארץ — וורדעל** across Home, collection and dedicated page; final title copy and selection/order remain pending.

The owner's role, project scope, process, visuals, and outcomes for each project remain undocumented. Use the reusable template below when those details are supplied.

The owner reports actual usage figures for existing products. Values, measurement definitions, dates, and supporting sources: TODO: Decision required

See the [content evidence inventory](03-content.md#product-user-counts). No numerical values or supporting sources have been supplied yet.

## Local Projects implementation — 2026-10-07

Status: **In progress**. The owner authorized the homepage section based on the supplied basement.studio image, a dedicated-page button for each project and four expandable details per project, with actual content supplied later. The existing three website projects are used provisionally in their inventory order; final Home selection/order is not approved.

| Inventory project | Local route | Current supplied content / gaps |
| --- | --- | --- |
| practice ai learning system | `/he/projects/practice-ai` | Supplied learning-system description; role, image, four questions/answers and outcomes await owner data. |
| Haaretz project | `/he/projects/haaretz` | Supplied newspaper association and label “וורדעל”, shown provisionally as “הארץ — וורדעל”; final title, role, image, four questions/answers and outcomes await owner data. |
| Chabad Club | `/he/projects/chabad-club` | Supplied name only; description, role, image, four questions/answers and outcomes await owner data. |

The same data powers Home, the collection and dedicated pages through `projects.items` in `src/i18n/dictionaries/he.ts`; `src/content/projects.ts` defines the shared shape. Each project contains four details with explicit placeholder labels and null answers. Native disclosures allow one open detail within a project, independently of other projects. Dedicated pages return to `/he#projects`; unknown slugs return 404. The subsequent owner request adds `/he/projects`, reached by **לצפייה בכל הפרויקטים** beside the Home heading. The static dark collection has all three projects, twelve details, three dedicated-page buttons and studio/home-return navigation. The Home section alone uses the section-only scroll reveal recorded in the workbook, with shifted entry/exit locations, a flat background layer and a light SSR/no-JavaScript fallback.

Use `null` for unavailable description/contribution/image/answer fields rather than inventing facts. To supply visuals later, place actual owner assets in `public/projects/` and replace `image: null` with `{ src: "/projects/filename.jpg", alt: "Accurate image description" }`. No project image assets were added. Roles, results, usage figures and final copy remain unresolved.

The [workbook](homepage-workbook.md#3-projects) records desktop/mobile composition and verification; the [decision log](14-decisions.md#projects-section-and-dedicated-project-pages) records the specific project-route authorization. Owner visual acceptance and all missing assets/questions remain pending; no production publication or final case-study copy approval is implied.

## Final case study hierarchy

TODO: Decision required

## Reusable project planning template

Copy this template for each project considered for inclusion. These are possible information categories, not a final case study structure, display order, or required website sections.

### Project overview

TODO: Decision required

### Client

TODO: Decision required

### Industry

TODO: Decision required

### Problem

TODO: Decision required

### Goals

TODO: Decision required

### My role

TODO: Decision required

### Scope

TODO: Decision required

### UX / product work

TODO: Decision required

### UI design

TODO: Decision required

### Development

TODO: Decision required

### Constraints

TODO: Decision required

### Process

TODO: Decision required

### Key decisions

TODO: Decision required

### Screens / visuals

TODO: Decision required

### Interaction / motion

TODO: Decision required

### Results

TODO: Decision required

### Outcomes

TODO: Decision required

### Lessons learned

TODO: Decision required
