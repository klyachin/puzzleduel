var allTestSuites = [];

requirejs(["tests/abc_division.test.js"], ()=>{
  allTestSuites.push(abcDivisionTestSuite);
})

requirejs(["tests/akari.test.js"], ()=>{
  allTestSuites.push(akariTestSuite);
})

requirejs(["tests/araf.test.js"], ()=>{
  allTestSuites.push(arafTestSuite);
})

requirejs(["tests/black_white.test.js"], ()=>{
  allTestSuites.push(blackWhiteTestSuite);
})

requirejs(["tests/clouds.test.js"], ()=>{
  allTestSuites.push(cloudsTestSuite);
})

requirejs(["tests/domino_castle_sum.test.js"], ()=>{
  allTestSuites.push(dominoCastleSumTestSuite);
})

requirejs(["tests/domino_hunt.test.js"], ()=>{
  allTestSuites.push(dominoHuntTestSuite);
})

requirejs(["tests/easy_as_coral.test.js"], ()=>{
  allTestSuites.push(easyAsCoralTestSuite);
})

requirejs(["tests/fence.test.js"], ()=>{
  allTestSuites.push(fenceTestSuite);
})

requirejs(["tests/foseruzu.test.js"], ()=>{
  allTestSuites.push(foseruzuTestSuite);
})

requirejs(["tests/gaps.test.js"], ()=>{
  allTestSuites.push(gapsTestSuite);
})

requirejs(["tests/heyawake.test.js"], ()=>{
  allTestSuites.push(heyawakeTestSuite);
})

requirejs(["tests/hitori.test.js"], ()=>{
  allTestSuites.push(hitoriTestSuite);
})

requirejs(["tests/l_shapes.test.js"], ()=>{
  allTestSuites.push(lShapesTestSuite);
})

requirejs(["tests/lits.test.js"], ()=>{
  allTestSuites.push(litsTestSuite);
})

requirejs(["tests/minesweeper_classic.test.js"], ()=>{
  allTestSuites.push(minesweeperClassicTestSuite);
})

requirejs(["tests/neighbors.test.js"], ()=>{
  allTestSuites.push(neighborsTestSuite);
})

requirejs(["tests/point_a_star.test.js"], ()=>{
  allTestSuites.push(pointAStarTestSuite);
})

requirejs(["tests/queens.test.js"], ()=>{
  allTestSuites.push(queensTestSuite);
})

requirejs(["tests/railroad.test.js"], ()=>{
  allTestSuites.push(railroadTestSuite);
})

requirejs(["tests/shikaku.test.js"], ()=>{
  allTestSuites.push(shikakuTestSuite);
})

requirejs(["tests/snake_dutch.test.js"], ()=>{
  allTestSuites.push(snakeDutchTestSuite);
})

requirejs(["tests/snake_max.test.js"], ()=>{
  allTestSuites.push(snakeMaxTestSuite);
})

requirejs(["tests/snake_simple.test.js"], ()=>{
  allTestSuites.push(snakeSimpleTestSuite);
})

requirejs(["tests/starbattle.test.js"], ()=>{
  allTestSuites.push(starbattleTestSuite);
})

requirejs(["tests/starbattle_smallregions.test.js"], ()=>{
  allTestSuites.push(starbattleSmallregionsTestSuite);
})

requirejs(["tests/spiral_galaxies.test.js"], ()=>{
  allTestSuites.push(spiralGalaxiesTestSuite);
})

requirejs(["tests/two_apiece.test.js"], ()=>{
  allTestSuites.push(twoApieceTestSuite);
})

requirejs(["tests/yin_yang_classic.test.js"], ()=>{
  allTestSuites.push(yinYangClassicTestSuite);
})

