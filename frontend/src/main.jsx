import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  ArrowRight,
  Github,
  Linkedin,
  Mail,
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  Trophy,
  Code2,
  Send,
  MapPin,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Award,
  BookOpen,
  Cpu,
  Layers,
  Terminal,
  Brain,
  MessageSquare,
  Compass,
  Palette,
  Check
} from 'lucide-react';
import profilePhoto from './assets/dharsana-photo.jpg';
import './style.css';

const skillCategories = [
  {
    category: 'Programming Languages',
    description: 'Foundational languages I actively practice for logic building and problem solving.',
    icon: Terminal,
    items: [
      { name: 'Python', level: 'Fundamentals & Scripting', badge: 'Active Practice' },
      { name: 'C', level: 'Memory & Foundational Logic', badge: 'Core Foundation' },
      { name: 'C++', level: 'Object-Oriented Programming', badge: 'Core Foundation' },
      { name: 'Java', level: 'OOP & Application Basics', badge: 'Core Foundation' }
    ]
  },
  {
    category: 'AI & Computational Thinking',
    description: 'Key areas of exploration within my Computer Science (AI & ML) specialization.',
    icon: Brain,
    items: [
      { name: 'AI & ML Fundamentals', level: 'Concepts, Intuition & Overview', badge: 'Specialization' },
      { name: 'Algorithmic Problem Solving', level: 'Flowcharts, Logic & Optimization', badge: 'Daily Practice' },
      { name: 'Data Structures Basics', level: 'Arrays, Strings & Recursion', badge: 'In Progress' },
      { name: 'Git & Version Control', level: 'Repositories & Basic Commands', badge: 'Essential Tool' }
    ]
  },
  {
    category: 'Professional & Interpersonal',
    description: 'Core strengths that enable effective collaboration, presentation, and team success.',
    icon: Award,
    items: [
      { name: 'English Communication', level: 'Articulate, Fluent & Professional', badge: 'Strength' },
      { name: 'Hackathon Prototyping', level: 'Rapid Ideation & Team Execution', badge: 'Award Winning' },
      { name: 'Team Collaboration', level: 'Synergy & Shared Goal Focus', badge: 'Demonstrated' },
      { name: 'Technical Presentation', level: 'Symposiums & Academic Forums', badge: 'Active' }
    ]
  }
];

const projects = [
  {
    num: '01',
    badge: 'Live Portfolio',
    type: 'PERSONAL SHOWCASE',
    title: 'Personal Developer Portfolio',
    description:
      'A responsive, accessible personal portfolio engineered with React, Vite, modern CSS, and Node.js/Express. Features a custom triple-theme system (Hybrid, Dark, Light), glassmorphic components, fluid animations, and a secure backend contact API with PostgreSQL integration.',
    tags: ['React', 'Vite', 'CSS3', 'Node.js', 'Express', 'PostgreSQL Ready'],
    featured: true,
    status: 'Live & Maintained'
  },
  {
    num: '02',
    badge: 'Specialization Track',
    type: 'IN PROGRESS LAB',
    title: 'AI & Machine Learning Explorations',
    description:
      'An ongoing hands-on exploration of machine learning algorithms and exploratory data analysis using Python. Implementing foundational concepts, statistical mathematics, and data preprocessing workflows as part of my B.E. AI & ML curriculum.',
    tags: ['Python', 'AI & ML', 'Data Analysis', 'NumPy', 'Learning'],
    featured: false,
    status: 'Active Learning'
  },
  {
    num: '03',
    badge: 'Core Fundamentals',
    type: 'PROBLEM SOLVING',
    title: 'Algorithmic Problem-Solving Suite',
    description:
      'A structured repository of solved computational problems, algorithmic exercises, and data structure implementations across C, C++, Java, and Python developed through academic coursework and hackathons.',
    tags: ['C / C++', 'Java', 'Python', 'Data Structures', 'Algorithms'],
    featured: false,
    status: 'Continuous Practice'
  }
];

const certifications = [
  {
    title: 'Python Programming Foundations',
    issuer: 'Coursework / Independent Certification Track',
    status: 'In Progress',
    description:
      'Building deep competence in Python data types, functions, modules, file operations, and object-oriented paradigms.',
    icon: Code2
  },
  {
    title: 'Artificial Intelligence & ML Fundamentals',
    issuer: 'B.E. Specialization & Online Platforms',
    status: 'Planned / Curriculum',
    description:
      'Understanding supervised & unsupervised learning, regression, classification, model evaluation, and modern AI toolkits.',
    icon: Brain
  },
  {
    title: 'Competitive Programming & Problem Solving',
    issuer: 'HackerRank & Campus Coding Clubs',
    status: 'Active Skill Building',
    description:
      'Practicing foundational algorithmic challenges, logic optimization, and competitive coding problem sets.',
    icon: Award
  }
];

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('dharsana-theme') || 'hybrid');
  const [menu, setMenu] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('dharsana-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'hybrid') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('hybrid');
  };

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setStatus({ type: '', message: '' });
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
      setStatus({
        type: 'success',
        message: 'Your message has been sent successfully! Thank you for reaching out.'
      });
      e.target.reset();
    } catch (err) {
      setStatus({
        type: 'error',
        message:
          'Contact form submissions are temporarily paused in this static preview. Full database & backend integration will be activated soon!'
      });
    } finally {
      setSending(false);
    }
  }

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Education', href: '#education' },
    { name: 'Skills', href: '#skills' },
    { name: 'Achievements', href: '#achievements' },
    { name: 'Projects', href: '#projects' },
    { name: 'Certifications', href: '#certifications' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <>
      {/* Navigation */}
      <header className="navwrap">
        <nav className="nav container">
          <a href="#home" className="brand" aria-label="Dharsana K Home">
            <span className="brandName">dharsana</span>
            <span className="brandDot">.</span>
            <span className="brandBadge">AI & ML</span>
          </a>

          <div className={`navlinks ${menu ? 'shown' : ''}`}>
            {navLinks.map((item) => (
              <a href={item.href} onClick={() => setMenu(false)} key={item.name}>
                {item.name}
              </a>
            ))}
            <a
              href="#contact"
              className="mobileConnectBtn"
              onClick={() => setMenu(false)}
            >
              Let's Connect <ArrowRight size={14} />
            </a>
          </div>

          <div className="navact">
            <button
              className="themebtn"
              onClick={toggleTheme}
              title={`Current: ${theme.toUpperCase()} mode. Click to cycle (Hybrid → Dark → Light)`}
              aria-label={`Toggle theme: currently ${theme}`}
            >
              {theme === 'hybrid' ? (
                <Sparkles size={16} className="themeIcon hybrid" />
              ) : theme === 'dark' ? (
                <Moon size={16} className="themeIcon dark" />
              ) : (
                <Sun size={16} className="themeIcon light" />
              )}
              <span className="themeLabel">
                {theme === 'hybrid' ? 'Hybrid' : theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            <button
              className="menubtn"
              onClick={() => setMenu(!menu)}
              aria-label="Toggle navigation menu"
              aria-expanded={menu}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO SECTION */}
        <section id="home" className="hero">
          <div className="heroGlow glowPrimary" />
          <div className="heroGlow glowSecondary" />

          <div className="container heroGrid">
            {/* Left Content */}
            <div className="intro">
              <div className="available">
                <span className="dot pulse" />
                <span>OPEN TO LEARNING & OPPORTUNITIES</span>
              </div>

              <p className="overline">
                HELLO, I'M DHARSANA K <span className="sparkleSymbol">✳</span>
              </p>

              <h1 className="heroTitle">
                Curious mind.
                <br />
                <span className="gradientText">Bold ideas.</span>
                <br />
                Bright future.
              </h1>

              <p className="herodesc">
                Computer Science Engineering undergraduate specializing in{' '}
                <b>Artificial Intelligence & Machine Learning</b> at{' '}
                <b>AVS Engineering College (Autonomous)</b>. Passionate about foundational programming,
                computational problem-solving, and crafting intelligent technologies for real-world impact.
              </p>

              <div className="buttons">
                <a className="primary" href="#projects">
                  Explore My Work <ArrowUpRight size={18} />
                </a>
                <a className="outline" href="#contact">
                  Let's Connect <ArrowRight size={18} />
                </a>
              </div>

              <div className="quickstats">
                <div className="statItem">
                  <strong>2029</strong>
                  <span>Graduating Year</span>
                </div>
                <div className="statItem divider" />
                <div className="statItem">
                  <strong>1st Place</strong>
                  <span>Hackathon Winner</span>
                </div>
                <div className="statItem divider" />
                <div className="statItem">
                  <strong>4+</strong>
                  <span>Core Languages</span>
                </div>
                <div className="statItem divider" />
                <div className="statItem">
                  <strong>B.E.</strong>
                  <span>AI & ML Track</span>
                </div>
              </div>
            </div>

            {/* Right Visual / Real Photo Portrait */}
            <div className="visual">
              {/* Soft decorative background glows & animated orbital rings */}
              <div className="ambientAura" />
              <div className="orbit orbit1" />
              <div className="orbit orbit2" />

              {/* Stylish Premium Portrait Frame */}
              <div className="portraitFrameWrapper">
                <div className="portraitFrame">
                  <div className="portraitImageContainer">
                    <img
                      src={profilePhoto}
                      alt="Dharsana K - Aspiring AI & ML Developer"
                      className="portraitPhoto"
                      loading="eager"
                    />
                    <div className="portraitOverlayGradient" />
                  </div>
                  <div className="portraitBadge">
                    <span className="portraitBadgeText">DHARSANA K</span>
                    <span className="portraitBadgeSub">B.E. CSE (AI & ML) · 2029</span>
                  </div>
                </div>
              </div>

              {/* Floating Badges */}
              <div className="floatLabel labelOne" title="Academic Specialization">
                <div className="badgeIconWrap purple">
                  <Brain size={17} />
                </div>
                <div>
                  <div className="badgeMain">AI & ML Student</div>
                  <div className="badgeSub">AVS Engg (Autonomous)</div>
                </div>
              </div>

              <div className="floatLabel labelTwo" title="1st Place Achievement">
                <div className="badgeIconWrap gold">
                  <Trophy size={17} />
                </div>
                <div>
                  <div className="badgeMain">1st Place Winner</div>
                  <div className="badgeSub">Competitive Hackathon</div>
                </div>
              </div>

              <div className="floatLabel labelThree" title="Passionate Programmer">
                <div className="badgeIconWrap cyan">
                  <Code2 size={17} />
                </div>
                <div>
                  <div className="badgeMain">Core Programmer</div>
                  <div className="badgeSub">Python · C · C++ · Java</div>
                </div>
              </div>
            </div>
          </div>

          <div className="scrollHint">
            <span>SCROLL TO EXPLORE</span>
            <span className="arrowDown">↓</span>
          </div>
        </section>

        {/* 01 / ABOUT SECTION */}
        <section id="about" className="section about">
          <div className="container twoCol">
            <div>
              <p className="eyebrow">01 / A LITTLE ABOUT ME</p>
              <h2>
                A learner with a <i className="textGradient">maker's mindset.</i>
              </h2>
              <div className="aboutPillars">
                <div className="pillarCard">
                  <div className="pillarIcon">
                    <Brain size={22} />
                  </div>
                  <div>
                    <h4>Aspiring AI & ML Engineer</h4>
                    <p>
                      Passionate about understanding machine learning foundations, algorithms, and
                      intelligent problem-solving from the ground up.
                    </p>
                  </div>
                </div>

                <div className="pillarCard">
                  <div className="pillarIcon">
                    <Trophy size={22} />
                  </div>
                  <div>
                    <h4>Competitive Hackathon Spirit</h4>
                    <p>
                      1st place hackathon winner with experience building prototypes under tight
                      deadlines and pitching ideas collaboratively.
                    </p>
                  </div>
                </div>

                <div className="pillarCard">
                  <div className="pillarIcon">
                    <Award size={22} />
                  </div>
                  <div>
                    <h4>Effective Communicator</h4>
                    <p>
                      Strong English communication and presentation skills, making complex ideas clear
                      and engaging for diverse audiences.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="aboutContent">
              <p className="bodylarge">
                Hello! I'm <b>Dharsana K</b>, a dedicated first-year Computer Science and Engineering
                student specializing in <b>Artificial Intelligence & Machine Learning</b> at{' '}
                <b>AVS Engineering College (Autonomous)</b>, graduating in <b>2029</b>.
              </p>

              <p>
                My entry into technology is fueled by genuine curiosity and an eagerness to create. I
                believe that great software and breakthrough AI applications start with solid
                fundamentals. Right now, I am actively honing my coding logic and problem-solving
                abilities in <b>Python</b>, <b>C</b>, <b>C++</b>, and <b>Java</b>.
              </p>

              <p>
                Winning <b>first place in a hackathon</b> was a defining milestone that affirmed my
                ability to collaborate effectively, brainstorm creative solutions, and deliver under
                pressure. I am also an active participant in technical symposiums, constantly seeking
                opportunities to expand my horizons and connect with like-minded peers.
              </p>

              <p>
                I am looking forward to gaining hands-on project experience, participating in more
                hackathons, and connecting with mentors in the software engineering and AI communities.
              </p>

              <div className="aboutMetaGrid">
                <div className="metaBox">
                  <span className="metaLabel">Location</span>
                  <span className="metaValue">Tamil Nadu, India</span>
                </div>
                <div className="metaBox">
                  <span className="metaLabel">Status</span>
                  <span className="metaValue">Undergraduate (Fresher)</span>
                </div>
                <div className="metaBox">
                  <span className="metaLabel">Graduation</span>
                  <span className="metaValue">Class of 2029</span>
                </div>
                <div className="metaBox">
                  <span className="metaLabel">Focus</span>
                  <span className="metaValue">AI & Machine Learning</span>
                </div>
              </div>

              <div className="aboutAction">
                <a className="textlink" href="#contact">
                  Start a conversation <ArrowUpRight size={17} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 02 / EDUCATION SECTION */}
        <section id="education" className="section whiteSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">02 / MY ACADEMIC PATH</p>
                <h2>
                  Education & <span className="purple">Specialization.</span>
                </h2>
              </div>
              <div className="headIconWrapper">
                <GraduationCap className="headIcon" size={36} />
              </div>
            </div>

            <div className="educationCard">
              <div className="eduHeader">
                <div className="yearChip">2025 — 2029 · EXPECTED GRADUATION</div>
                <span className="eduStatusBadge">Current Degree</span>
              </div>

              <div className="eduContent">
                <div className="eduMainInfo">
                  <h3>Bachelor of Engineering (B.E.)</h3>
                  <p className="purpleText">
                    Computer Science and Engineering (Artificial Intelligence & Machine Learning)
                  </p>
                  <p className="collegeName">
                    <b>AVS ENGINEERING COLLEGE (AUTONOMOUS)</b>
                  </p>
                </div>

                <div className="eduHighlights">
                  <h4>Academic & Practical Focus:</h4>
                  <ul className="eduList">
                    <li>
                      <Check size={16} className="eduCheck" />
                      <span>Foundational Computer Science: Programming in Python, C, C++, and Java</span>
                    </li>
                    <li>
                      <Check size={16} className="eduCheck" />
                      <span>Mathematics & Logical Foundations for Artificial Intelligence & ML</span>
                    </li>
                    <li>
                      <Check size={16} className="eduCheck" />
                      <span>Data Structures, Object-Oriented Principles, and Algorithmic Thinking</span>
                    </li>
                    <li>
                      <Check size={16} className="eduCheck" />
                      <span>Active involvement in campus coding contests, technical workshops, and symposiums</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="educationBottom">
                <span>
                  <MapPin size={15} /> Tamil Nadu, India
                </span>
                <span>Full-Time Undergraduate Degree Program</span>
                <span>Autonomous Institution</span>
              </div>
            </div>
          </div>
        </section>

        {/* 03 / SKILLS SECTION */}
        <section id="skills" className="section skillsSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">03 / TECHNICAL TOOLKIT</p>
                <h2>
                  Skills & <i>competencies.</i>
                </h2>
              </div>
              <p className="sectionDesc">
                Structured foundations and practical skills built through coursework, hackathons, and
                continuous coding practice.
              </p>
            </div>

            <div className="skillsCategoryWrapper">
              {skillCategories.map((cat, idx) => {
                const CatIcon = cat.icon;
                return (
                  <div className="skillCategoryCard" key={idx}>
                    <div className="catHeader">
                      <div className="catIconWrap">
                        <CatIcon size={22} />
                      </div>
                      <div>
                        <h3>{cat.category}</h3>
                        <p>{cat.description}</p>
                      </div>
                    </div>

                    <div className="catSkillsList">
                      {cat.items.map((skill, sIdx) => (
                        <div className="skillItem" key={sIdx}>
                          <div className="skillItemTop">
                            <span className="skillItemName">{skill.name}</span>
                            <span className="skillItemBadge">{skill.badge}</span>
                          </div>
                          <span className="skillItemLevel">{skill.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 04 / ACHIEVEMENTS SECTION */}
        <section id="achievements" className="section achieveSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">04 / MILESTONES & HONORS</p>
                <h2>
                  Proven drive. <i className="textGradient">Big motivation.</i>
                </h2>
              </div>
              <p className="sectionDesc">
                Milestones that showcase practical problem solving, teamwork, and proactive learning.
              </p>
            </div>

            <div className="achGrid">
              {/* Highlight Hackathon Win Card */}
              <div className="achMain">
                <div className="achMainGlow" />
                <div className="achTopRow">
                  <div className="achIcon">
                    <Trophy size={34} />
                  </div>
                  <span className="awardType">★ HIGHLIGHT ACHIEVEMENT</span>
                </div>

                <div className="achTitleWrapper">
                  <span className="awardPlaceBadge">1ST PLACE WINNER</span>
                  <h3>Competitive Hackathon Champion</h3>
                </div>

                <p className="achMainText">
                  Secured <b>1st place</b> in a competitive technical hackathon. Collaborated closely
                  with team members under strict time constraints to conceptualize, design, and pitch a
                  novel software prototype. Showcased rapid problem-solving, clean logic, and confident
                  communication during the judging round.
                </p>

                <div className="achPillList">
                  <span>1st Place Trophy</span>
                  <span>Team Prototyping</span>
                  <span>Rapid Problem Solving</span>
                  <span>Judge Pitch & Demo</span>
                </div>

                <div className="achBottom">
                  <span>VERIFIED RECOGNITION</span>
                  <span>01 / AWARDS</span>
                </div>
              </div>

              {/* Side Achievements */}
              <div className="achSideCol">
                <div className="achSide">
                  <div className="achSideIcon">
                    <Sparkles size={24} />
                  </div>
                  <span className="achMiniTag">EVENT ENGAGEMENT</span>
                  <h3>Technical Symposium Participation</h3>
                  <p>
                    Actively participated in departmental and inter-collegiate technical symposiums,
                    engaging in technical events, coding challenges, and academic exchange with peers.
                  </p>
                  <div className="achSidePillList">
                    <span>Technical Contests</span>
                    <span>Knowledge Sharing</span>
                  </div>
                  <span className="achBottom">02 / PARTICIPATION</span>
                </div>

                <div className="achSide">
                  <div className="achSideIcon">
                    <BookOpen size={24} />
                  </div>
                  <span className="achMiniTag">ACADEMIC EXCELLENCE</span>
                  <h3>AI & ML Foundations Track</h3>
                  <p>
                    Maintaining rigorous academic focus on core computer science subjects, combining
                    theory with independent hands-on exercises in Python, C, C++, and Java.
                  </p>
                  <div className="achSidePillList">
                    <span>Autonomous Curriculum</span>
                    <span>Continuous Learning</span>
                  </div>
                  <span className="achBottom">03 / INITIATIVE</span>
                </div>
              </div>
            </div>

            <p className="fineprint">
              * Event names, certificates, and project documentation are documented as part of ongoing
              academic credentials.
            </p>
          </div>
        </section>

        {/* 05 / PROJECTS SECTION */}
        <section id="projects" className="section projectsSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">05 / PRACTICAL WORK</p>
                <h2>
                  Featured <i>projects.</i>
                </h2>
              </div>
              <p className="sectionDesc">
                Real, honest projects reflecting my learning path, software foundations, and technical
                curiosity.
              </p>
            </div>

            <div className="projectGrid">
              {projects.map((p, i) => (
                <article className={`projectCard ${p.featured ? 'featuredProject' : ''}`} key={p.num}>
                  <div className={`projectArt art${i}`}>
                    <div className="artDecorBg" />
                    <div className="projectArtHeader">
                      <span className="artIndex">{p.num} / 03</span>
                      <span className="projectStatusTag">{p.status}</span>
                    </div>

                    <div className="artGraphicSymbol">
                      {i === 0 ? <Code2 size={70} /> : i === 1 ? <Brain size={70} /> : <Terminal size={70} />}
                    </div>

                    <div className="projectArtBadge">{p.badge}</div>
                  </div>

                  <div className="projectInfo">
                    <div className="projectMeta">
                      <span className="projectType">{p.type}</span>
                    </div>

                    <h3>{p.title}</h3>
                    <p>{p.description}</p>

                    <div className="tags">
                      {p.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>

                    {p.featured ? (
                      <div className="projectActionRow">
                        <a href="#home" className="projectLink">
                          Current Live Site <ArrowUpRight size={15} />
                        </a>
                      </div>
                    ) : (
                      <div className="projectActionRow">
                        <span className="projectNote">Active Learning & Development</span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 06 / CERTIFICATIONS SECTION (NEW PLACEHOLDER) */}
        <section id="certifications" className="section certSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">06 / CREDENTIALS & COURSES</p>
                <h2>
                  Certifications & <i>learning tracks.</i>
                </h2>
              </div>
              <p className="sectionDesc">
                Structured certification pathways to validate theoretical understanding and practical
                coding standards.
              </p>
            </div>

            <div className="certGrid">
              {certifications.map((cert, index) => {
                const CertIcon = cert.icon;
                return (
                  <div className="certCard" key={index}>
                    <div className="certHeader">
                      <div className="certIconWrap">
                        <CertIcon size={22} />
                      </div>
                      <span className="certStatusPill">{cert.status}</span>
                    </div>

                    <h3>{cert.title}</h3>
                    <div className="certIssuer">{cert.issuer}</div>
                    <p>{cert.description}</p>

                    <div className="certFooter">
                      <span className="certPlaceholderNote">
                        <CheckCircle2 size={14} /> Credential verification link will be added upon completion
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 07 / CONTACT SECTION */}
        <section id="contact" className="section contactSection">
          <div className="container contactGrid">
            <div>
              <p className="eyebrow">07 / GET IN TOUCH</p>
              <h2>
                Have an idea?
                <br />
                <i className="textGradient">Let's connect.</i>
              </h2>

              <p className="contactText">
                I am actively seeking hackathon team collaborations, learning opportunities, and student
                mentorship. Whether you'd like to talk about AI & ML, discuss an upcoming event, or
                simply say hello, my inbox is always open!
              </p>

              <div className="contactDetailsList">
                <div className="contactDetailItem">
                  <div className="contactDetailIcon">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="contactDetailLabel">Location</div>
                    <div className="contactDetailVal">Tamil Nadu, India</div>
                  </div>
                </div>

                <div className="contactDetailItem">
                  <div className="contactDetailIcon">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <div className="contactDetailLabel">College & Degree</div>
                    <div className="contactDetailVal">
                      AVS Engineering College (Autonomous) · CSE (AI & ML)
                    </div>
                  </div>
                </div>

                <div className="contactDetailItem">
                  <div className="contactDetailIcon">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="contactDetailLabel">Direct Reach</div>
                    <div className="contactDetailVal">Available via the contact form below</div>
                  </div>
                </div>
              </div>

              <div className="contactNote staticPreviewNotice">
                <Sparkles size={18} className="noteIcon" />
                <span>
                  <b>Static Deployment Notice:</b> Backend & database services are currently being configured. Direct form submissions are temporarily offline.
                </span>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contactFormWrapper">
              <form className="contactForm" onSubmit={submit}>
                <h3 className="formTitle">Send a Message</h3>
                <p className="formSubtitle">
                  Feel free to leave your note and I'll respond as soon as possible.
                </p>

                <div className="formGroup">
                  <label htmlFor="fullname">
                    Your Name <span className="req">*</span>
                  </label>
                  <input
                    id="fullname"
                    name="name"
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="email">
                    Email Address <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    maxLength={254}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="message">
                    Your Message <span className="req">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell me about your project, idea, or opportunity (min 10 characters)..."
                    rows={5}
                    minLength={10}
                    maxLength={3000}
                    required
                  />
                </div>

                <button className="primary sendBtn" disabled={sending} type="submit">
                  {sending ? (
                    <>
                      <span>Sending Message...</span>
                      <span className="spinner" />
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={16} />
                    </>
                  )}
                </button>

                {status.message && (
                  <div
                    role="status"
                    className={`formStatus ${status.type === 'error' ? 'statusError' : 'statusSuccess'}`}
                  >
                    {status.type === 'error' ? (
                      <X size={18} className="statusIcon" />
                    ) : (
                      <CheckCircle2 size={18} className="statusIcon" />
                    )}
                    <span>{status.message}</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footerRow">
          <div className="footerBrandBlock">
            <a href="#home" className="brand footerBrand">
              <span className="brandName">dharsana</span>
              <span className="brandDot">.</span>
            </a>
            <p className="footerTagline">
              B.E. Computer Science Engineering (AI & ML) · AVS Engineering College (Autonomous)
            </p>
          </div>

          <div className="footerCenter">
            <p className="copyright">
              Designed with curiosity & passion · © {new Date().getFullYear()} Dharsana K. All rights reserved.
            </p>
          </div>

          <div className="footerRight">
            <a href="#home" className="backtop">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
