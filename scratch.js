const STADIUM_DATA = {
  zones: [
    { id: 'gate-north', position: { x: 200, y: 30 } },
    { id: 'restroom-ne', position: { x: 310, y: 80 } }
  ],
  connections: [
    { from: 'gate-north', to: 'restroom-ne', distance: 80, travelTime: 60 }
  ]
};

const route = ['gate-north', 'restroom-ne'];
console.log("Route path:", route);
