import { studySetSchema, type StudySet } from '../../shared/schema';

export const topics = [
  {
    id: 'photosynthesis',
    title: 'The science of green',
    subject: 'Biology',
    label: 'Photosynthesis',
    notes:
      'Explain photosynthesis: how plants use sunlight, chlorophyll, water, and carbon dioxide to produce glucose and oxygen. Cover chloroplasts, light-dependent reactions, the Calvin cycle, and the role of stomata.',
  },
  {
    id: 'space',
    title: 'A little cosmic perspective',
    subject: 'Astronomy',
    label: 'Our solar system',
    notes:
      'Teach me about our solar system: the Sun, inner rocky planets, gas and ice giants, orbits, gravity, moons, and the difference between planets and dwarf planets.',
  },
  {
    id: 'react',
    title: 'Think in components',
    subject: 'Development',
    label: 'React fundamentals',
    notes:
      'Explain React fundamentals: functional components, props, state with useState, effects with useEffect, the rules of hooks, and why list items need stable keys.',
  },
] as const;

const rawExamples: Record<string, StudySet> = {
  photosynthesis: {
    title: 'The science of green',
    subject: 'Biology',
    description:
      'From a ray of sunlight to the energy that keeps a plant growing. Let’s make photosynthesis stick.',
    cards: [
      {
        question: 'What is the main purpose of photosynthesis?',
        answer:
          'To convert light energy into chemical energy stored in glucose. Plants use carbon dioxide and water, releasing oxygen as a byproduct.',
        tag: 'The big picture',
      },
      {
        question: 'Where does photosynthesis take place in a plant cell?',
        answer:
          'In chloroplasts. The light-dependent reactions occur in the thylakoid membranes, while the Calvin cycle occurs in the stroma.',
        tag: 'Inside the cell',
      },
      {
        question: 'What role does chlorophyll play in photosynthesis?',
        answer:
          'Chlorophyll absorbs light, especially red and blue wavelengths, to power the light-dependent reactions. It reflects much of the green light, making leaves look green.',
        tag: 'Light & color',
      },
      {
        question: 'What do the light-dependent reactions produce?',
        answer:
          'They produce ATP and NADPH, which supply energy and electrons for the Calvin cycle. Splitting water during these reactions also releases oxygen.',
        tag: 'Light reactions',
      },
      {
        question: 'How does the Calvin cycle help make sugar?',
        answer:
          'It uses ATP and NADPH to fix carbon dioxide into a three-carbon molecule called G3P. Some G3P is used to build glucose and other carbohydrates.',
        tag: 'Calvin cycle',
      },
      {
        question: 'Why are stomata important for photosynthesis?',
        answer:
          'Stomata are tiny pores that allow carbon dioxide to enter leaves and oxygen to leave. Guard cells regulate them, balancing gas exchange with water loss.',
        tag: 'Gas exchange',
      },
    ],
    quiz: [
      {
        question: 'Which form of energy is stored in glucose after photosynthesis?',
        options: ['Sound energy', 'Chemical energy', 'Nuclear energy', 'Mechanical energy'],
        correctIndex: 1,
        explanation:
          'Photosynthesis transforms light energy into chemical energy stored in the bonds of carbohydrates.',
      },
      {
        question: 'Where do the light-dependent reactions happen?',
        options: ['The nucleus', 'The stroma', 'The thylakoid membranes', 'The cell wall'],
        correctIndex: 2,
        explanation:
          'Photosystems and the electron transport chain are located in the thylakoid membranes of chloroplasts.',
      },
      {
        question: 'Why do most leaves appear green?',
        options: [
          'Chlorophyll reflects much of the green light',
          'Leaves absorb only green light',
          'Glucose is a green pigment',
          'Water turns sunlight green',
        ],
        correctIndex: 0,
        explanation:
          'Chlorophyll absorbs red and blue light more strongly and reflects or transmits much of the green light.',
      },
      {
        question: 'Which pair directly supplies energy and electrons to the Calvin cycle?',
        options: [
          'Oxygen and water',
          'Glucose and oxygen',
          'Carbon dioxide and glucose',
          'ATP and NADPH',
        ],
        correctIndex: 3,
        explanation:
          'ATP provides usable energy, and NADPH provides high-energy electrons for the Calvin cycle.',
      },
      {
        question: 'What is the carbon source used by the Calvin cycle?',
        options: [
          'Water from the roots',
          'Carbon dioxide from the air',
          'Oxygen released by leaves',
          'Minerals in the soil',
        ],
        correctIndex: 1,
        explanation:
          'The Calvin cycle fixes carbon from atmospheric carbon dioxide into organic molecules.',
      },
      {
        question: 'What happens when stomata close to conserve water?',
        options: [
          'More carbon dioxide enters',
          'Chlorophyll disappears immediately',
          'Carbon dioxide intake decreases',
          'The Calvin cycle makes oxygen',
        ],
        correctIndex: 2,
        explanation:
          'Closing stomata reduces water loss but also limits carbon dioxide entering the leaf, which can slow photosynthesis.',
      },
    ],
  },
  space: {
    title: 'A little cosmic perspective',
    subject: 'Astronomy',
    description: 'Meet our neighborhood in space, one small discovery at a time.',
    cards: [
      {
        question: 'What keeps the planets in orbit around the Sun?',
        answer:
          'The Sun’s gravitational pull continually curves each planet’s path. A planet’s forward motion and the Sun’s gravity together create its orbit.',
        tag: 'Gravity',
      },
      {
        question: 'Which planets are the four inner rocky planets?',
        answer:
          'Mercury, Venus, Earth, and Mars. They have solid surfaces and lie closer to the Sun than the giant planets.',
        tag: 'Rocky worlds',
      },
      {
        question: 'How do gas giants differ from ice giants?',
        answer:
          'Jupiter and Saturn are gas giants dominated by hydrogen and helium. Uranus and Neptune are ice giants with larger proportions of heavier substances, including water, ammonia, and methane.',
        tag: 'Giant planets',
      },
      {
        question: 'Why is Pluto classified as a dwarf planet?',
        answer:
          'Pluto orbits the Sun and is nearly round, but it has not cleared its orbital neighborhood of other objects. Clearing the orbital neighborhood is one criterion for a planet.',
        tag: 'Dwarf planets',
      },
      {
        question: 'What is the main source of the Sun’s energy?',
        answer:
          'Nuclear fusion in its core. Hydrogen nuclei combine to form helium, releasing energy that eventually travels outward as light and heat.',
        tag: 'Our star',
      },
      {
        question: 'What is a natural satellite?',
        answer:
          'An object that naturally orbits a planet or another larger non-stellar body. Earth’s Moon is a natural satellite of Earth.',
        tag: 'Moons',
      },
    ],
    quiz: [
      {
        question: 'Which force keeps Earth on a curved orbital path around the Sun?',
        options: ['Magnetism', 'Gravity', 'Friction', 'Air pressure'],
        correctIndex: 1,
        explanation:
          'The Sun’s gravity provides the inward acceleration that bends Earth’s path into an orbit.',
      },
      {
        question: 'Which group contains only rocky planets?',
        options: [
          'Jupiter, Saturn, Uranus',
          'Earth, Neptune, Mars',
          'Mercury, Venus, Earth',
          'Saturn, Mars, Neptune',
        ],
        correctIndex: 2,
        explanation: 'Mercury, Venus, Earth, and Mars are the four inner rocky planets.',
      },
      {
        question: 'Which planet is an ice giant?',
        options: ['Neptune', 'Jupiter', 'Mercury', 'Saturn'],
        correctIndex: 0,
        explanation: 'Neptune and Uranus are ice giants; Jupiter and Saturn are gas giants.',
      },
      {
        question: 'Which criterion for a planet does Pluto fail to meet?',
        options: [
          'Orbiting the Sun',
          'Being nearly round',
          'Having any gravity',
          'Clearing its orbital neighborhood',
        ],
        correctIndex: 3,
        explanation:
          'Pluto shares its orbital neighborhood with other Kuiper Belt objects and has not cleared it.',
      },
      {
        question: 'What process powers the Sun?',
        options: [
          'Burning coal',
          'Nuclear fusion',
          'Chemical combustion',
          'Nuclear fission of uranium',
        ],
        correctIndex: 1,
        explanation:
          'The Sun’s core fuses hydrogen into helium, converting a small amount of mass into energy.',
      },
      {
        question: 'Which object is a natural satellite of Earth?',
        options: ['The Sun', 'Mars', 'The Moon', 'Pluto'],
        correctIndex: 2,
        explanation: 'The Moon is Earth’s natural satellite because it naturally orbits Earth.',
      },
    ],
  },
  react: {
    title: 'Think in components',
    subject: 'Development',
    description: 'Build a solid mental model of React, from your first prop to your next effect.',
    cards: [
      {
        question: 'What is a functional component in React?',
        answer:
          'A JavaScript function that returns a description of the UI, usually written as JSX. React composes these components to build an interface.',
        tag: 'Components',
      },
      {
        question: 'How do props and state differ in React?',
        answer:
          'Props are read-only inputs passed from a parent. State is a component’s memory, managed through setters such as the one returned by useState.',
        tag: 'Data flow',
      },
      {
        question: 'What does the useState hook return?',
        answer:
          'An array containing the current state value and a setter function. Calling the setter schedules an update so React can render the new state.',
        tag: 'State',
      },
      {
        question: 'When should you use the useEffect hook?',
        answer:
          'To synchronize a component with an external system, such as a browser event listener or a network connection. Return a cleanup function when that synchronization needs to be undone.',
        tag: 'Effects',
      },
      {
        question: 'Why must hooks be called at the top level?',
        answer:
          'React associates hook state with call order. Calling hooks inside conditions or loops can change that order between renders and associate state with the wrong call.',
        tag: 'Rules of hooks',
      },
      {
        question: 'Why do rendered list items need stable keys?',
        answer:
          'Keys help React match items between renders so it can preserve the correct component identity and state. Use a stable ID from the data when possible.',
        tag: 'Lists & identity',
      },
    ],
    quiz: [
      {
        question: 'What does a React functional component usually return?',
        options: [
          'A database table',
          'JSX describing the UI',
          'Only a CSS file',
          'A browser window',
        ],
        correctIndex: 1,
        explanation:
          'A functional component returns React elements, usually expressed as JSX, to describe its UI.',
      },
      {
        question: 'Which statement about props is correct?',
        options: [
          'Children should mutate them directly',
          'They can only contain strings',
          'They are read-only inputs from a parent',
          'They replace all component state',
        ],
        correctIndex: 2,
        explanation:
          'Props communicate data from parent to child. Components treat received props as read-only.',
      },
      {
        question: 'Which useState update safely depends on the previous count?',
        options: [
          'setCount(previous => previous + 1)',
          'count = count + 1',
          'useState(count + 1) in a click handler',
          'props.count++',
        ],
        correctIndex: 0,
        explanation:
          'A functional setter receives the pending previous value, avoiding reliance on a stale render’s value.',
      },
      {
        question: 'Which task is a good use for useEffect?',
        options: [
          'Computing a sum from two props',
          'Calling a hook conditionally',
          'Rendering a heading',
          'Subscribing to a browser event with cleanup',
        ],
        correctIndex: 3,
        explanation:
          'Effects synchronize with external systems. An event subscription should remove its listener during cleanup.',
      },
      {
        question: 'Where should hooks normally be called?',
        options: [
          'Inside loops',
          'At the top level of a component or custom hook',
          'Only in click handlers',
          'Inside conditional branches',
        ],
        correctIndex: 1,
        explanation:
          'Calling hooks unconditionally at the top level preserves a consistent call order between renders.',
      },
      {
        question: 'Which key is best for a list that can be reordered?',
        options: [
          'Math.random() on every render',
          'The current array index',
          'A stable unique ID from the item',
          'The same string for every item',
        ],
        correctIndex: 2,
        explanation:
          'Stable item IDs let React track each item’s identity when the list changes order.',
      },
    ],
  },
};

// Examples go through the same contract as live output, and are always labeled.
export const examples = Object.fromEntries(
  Object.entries(rawExamples).map(([key, set]) => [key, studySetSchema.parse(set)]),
);
