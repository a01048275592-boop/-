// ============================================================
// anhani.com - 교육 과외 동적 페이지 생성 Worker
// ============================================================

// --- 해시 함수 (결정적 랜덤) ---
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(arr, n, rng) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

// --- 지역 데이터 ---
const REGIONS = {
  "서울": ["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"],
  "부산": ["강서구","금정구","기장군","남구","동구","동래구","부산진구","북구","사상구","사하구","서구","수영구","연제구","영도구","중구","해운대구"],
  "대구": ["남구","달서구","달성군","동구","북구","서구","수성구","중구"],
  "인천": ["강화군","계양구","남동구","동구","미추홀구","부평구","서구","연수구","옹진군","중구"],
  "광주": ["광산구","남구","동구","북구","서구"],
  "대전": ["대덕구","동구","서구","유성구","중구"],
  "울산": ["남구","동구","북구","울주군","중구"],
  "세종": ["세종시"],
  "경기": ["가평군","고양시","과천시","광명시","광주시","구리시","군포시","김포시","남양주시","동두천시","부천시","성남시","수원시","시흥시","안산시","안성시","안양시","양주시","양평군","여주시","연천군","오산시","용인시","의왕시","의정부시","이천시","파주시","평택시","포천시","하남시","화성시"],
  "강원": ["강릉시","고성군","동해시","삼척시","속초시","양구군","양양군","영월군","원주시","인제군","정선군","철원군","춘천시","태백시","평창군","홍천군","화천군","횡성군"],
  "충북": ["괴산군","단양군","보은군","영동군","옥천군","음성군","제천시","증평군","진천군","청주시","충주시"],
  "충남": ["계룡시","공주시","금산군","논산시","당진시","보령시","부여군","서산시","서천군","아산시","예산군","천안시","청양군","태안군","홍성군"],
  "전북": ["고창군","군산시","김제시","남원시","무주군","부안군","순창군","완주군","익산시","임실군","장수군","전주시","정읍시","진안군"],
  "전남": ["강진군","고흥군","곡성군","광양시","구례군","나주시","담양군","목포시","무안군","보성군","순천시","신안군","여수시","영광군","영암군","완도군","장성군","장흥군","진도군","함평군","해남군","화순군"],
  "경북": ["경산시","경주시","고령군","구미시","군위군","김천시","문경시","봉화군","상주시","성주군","안동시","영덕군","영양군","영주시","영천시","예천군","울릉군","울진군","의성군","청도군","청송군","칠곡군","포항시"],
  "경남": ["거제시","거창군","고성군","김해시","남해군","밀양시","사천시","산청군","양산시","의령군","진주시","창녕군","창원시","통영시","하동군","함안군","함양군","합천군"],
  "제주": ["제주시","서귀포시"]
};

// 읍/면 데이터 (주요 군 단위)
const EUP_MYEON = {
  "기장군": ["기장읍","장안읍","정관읍","일광면","철마면"],
  "달성군": ["화원읍","논공읍","다사읍","유가읍","옥포읍","현풍읍","가창면","구지면","하빈면"],
  "강화군": ["강화읍","선원면","불은면","길상면","화도면","양도면","내가면","하점면","송해면","교동면"],
  "옹진군": ["북도면","백령면","대청면","덕적면","영흥면","자월면","연평면"],
  "울주군": ["온산읍","언양읍","범서읍","청량읍","삼남읍","상북면","삼동면","서생면","두동면","두서면","웅촌면"],
  "가평군": ["가평읍","설악면","청평면","상면","조종면","북면"],
  "양평군": ["양평읍","강상면","강하면","양서면","옥천면","서종면","단월면","청운면","양동면","지평면","용문면"],
  "연천군": ["연천읍","전곡읍","청산면","백학면","미산면","왕징면","신서면","중면","장남면"],
  "고성군": ["간성읍","거진읍","현내면","죽왕면","토성면","수동면"],
  "양구군": ["양구읍","남면","동면","방산면","해안면"],
  "양양군": ["양양읍","서면","손양면","현북면","현남면","강현면"],
  "영월군": ["영월읍","상동읍","무릉도원면","남면","한반도면","김삿갓면","북면","주천면"],
  "인제군": ["인제읍","남면","북면","기린면","서화면","상남면"],
  "정선군": ["정선읍","고한읍","사북읍","신동읍","남면","북평면","임계면","화암면","여량면"],
  "철원군": ["갈말읍","동송읍","김화읍","서면","근남면","근북면","근동면"],
  "평창군": ["평창읍","미탄면","방림면","대화면","봉평면","용평면","진부면","대관령면"],
  "홍천군": ["홍천읍","화촌면","두촌면","내촌면","서석면","동면","남면","서면","북방면","내면"],
  "화천군": ["화천읍","간동면","하남면","상서면","사내면"],
  "횡성군": ["횡성읍","우천면","안흥면","둔내면","갑천면","청일면","공근면","서원면"],
  "괴산군": ["괴산읍","감물면","장연면","연풍면","칠성면","문광면","청안면","청천면","사리면","소수면","불정면"],
  "단양군": ["단양읍","매포읍","적성면","대강면","가곡면","영춘면","어상천면"],
  "보은군": ["보은읍","속리산면","장안면","마로면","탄부면","삼승면","수한면","회남면","내북면","산외면","외속리면"],
  "영동군": ["영동읍","용산면","황간면","추풍령면","매곡면","상촌면","양강면","용화면","학산면","양산면"],
  "옥천군": ["옥천읍","동이면","안남면","안내면","청성면","청산면","이원면","군서면","군북면"],
  "음성군": ["음성읍","금왕읍","소이면","원남면","맹동면","대소면","삼성면","생극면","감곡면"],
  "증평군": ["증평읍","도안면"],
  "진천군": ["진천읍","덕산읍","초평면","문백면","백곡면","이월면","광혜원면"],
  "금산군": ["금산읍","금성면","제원면","부리면","군북면","남일면","남이면","진산면","복수면","추부면"],
  "부여군": ["부여읍","규암면","은산면","외산면","내산면","구룡면","홍산면","옥산면","남면","충화면","양화면","임천면","장암면","석성면","초촌면","세도면"],
  "서천군": ["서천읍","장항읍","기산면","한산면","화양면","비인면","서면","문산면","판교면","종천면","마서면","시초면"],
  "예산군": ["예산읍","삽교읍","대술면","신양면","광시면","대흥면","응봉면","덕산면","봉산면","고덕면","신암면","오가면"],
  "청양군": ["청양읍","운곡면","대치면","정산면","목면","청남면","장평면","남양면","화성면","비봉면"],
  "태안군": ["태안읍","안면읍","고남면","남면","근흥면","소원면","원북면","이원면"],
  "홍성군": ["홍성읍","광천읍","홍북읍","금마면","홍동면","장곡면","은하면","결성면","서부면","갈산면","구항면"],
  "고창군": ["고창읍","고수면","아산면","무장면","공음면","상하면","해리면","성송면","대산면","심원면","흥덕면","성내면","신림면","부안면"],
  "무주군": ["무주읍","무풍면","설천면","적상면","안성면","부남면"],
  "부안군": ["부안읍","줄포면","보안면","변산면","진서면","백산면","상서면","동진면","주산면","위도면","하서면","계화면"],
  "순창군": ["순창읍","인계면","동계면","적성면","유등면","풍산면","금과면","팔덕면","쌍치면","복흥면","구림면"],
  "완주군": ["삼례읍","봉동읍","용진읍","상관면","이서면","소양면","구이면","고산면","비봉면","운주면","화산면","동상면","경천면"],
  "임실군": ["임실읍","청웅면","운암면","신평면","삼계면","관촌면","신덕면","성수면","오수면","강진면","덕치면","지사면"],
  "장수군": ["장수읍","산서면","번암면","장계면","천천면","계남면","계북면"],
  "진안군": ["진안읍","용담면","안천면","동향면","마령면","성수면","백운면","부귀면","정천면","주천면","상전면"],
  "강진군": ["강진읍","군동면","칠량면","대구면","도암면","신전면","성전면","작천면","병영면","옴천면","마량면"],
  "고흥군": ["고흥읍","도양읍","풍양면","도덕면","금산면","도화면","포두면","봉래면","점암면","과역면","남양면","동일면","대서면","두원면","영남면","동강면"],
  "곡성군": ["곡성읍","오곡면","삼기면","석곡면","목사동면","죽곡면","고달면","옥과면","입면","겸면","오산면"],
  "구례군": ["구례읍","문척면","간전면","토지면","마산면","광의면","용방면","산동면"],
  "담양군": ["담양읍","봉산면","고서면","남면","창평면","대덕면","무정면","금성면","용면","월산면","수북면","대전면"],
  "무안군": ["무안읍","일로읍","삼향읍","몽탄면","청계면","현경면","망운면","해제면","운남면"],
  "보성군": ["보성읍","벌교읍","노동면","미력면","겸백면","율어면","복내면","문덕면","조성면","득량면","회천면","웅치면"],
  "신안군": ["지도읍","압해읍","증도면","임자면","자은면","비금면","도초면","흑산면","하의면","신의면","장산면","안좌면","팔금면","암태면"],
  "영광군": ["영광읍","백수읍","홍농읍","대마면","묘량면","불갑면","군서면","군남면","염산면","법성면","낙월면"],
  "영암군": ["영암읍","삼호읍","덕진면","금정면","신북면","시종면","도포면","군서면","서호면","학산면","미암면"],
  "완도군": ["완도읍","금일읍","노화읍","군외면","신지면","고금면","약산면","청산면","소안면","금당면","보길면","생일면"],
  "장성군": ["장성읍","남면","동화면","삼서면","삼계면","황룡면","서삼면","북일면","북이면","북하면","진원면"],
  "장흥군": ["장흥읍","관산읍","대덕읍","용산면","안양면","장동면","장평면","유치면","부산면","회진면"],
  "진도군": ["진도읍","군내면","고군면","의신면","임회면","지산면","조도면"],
  "함평군": ["함평읍","손불면","신광면","학교면","엄다면","대동면","나산면","해보면","월야면"],
  "해남군": ["해남읍","삼산면","화산면","현산면","송지면","북평면","북일면","옥천면","계곡면","마산면","황산면","산이면","문내면","화원면"],
  "화순군": ["화순읍","한천면","춘양면","청풍면","이양면","능주면","도곡면","도암면","이서면","북면","동복면","남면","동면"],
  "고령군": ["대가야읍","덕곡면","운수면","성산면","다산면","개진면","우곡면","쌍림면"],
  "군위군": ["군위읍","소보면","효령면","부계면","우보면","의흥면","산성면","삼국유사면"],
  "봉화군": ["봉화읍","물야면","봉성면","법전면","춘양면","소천면","재산면","명호면","상운면","석포면"],
  "성주군": ["성주읍","선남면","용암면","수륜면","가천면","금수면","대가면","벽진면","초전면","월항면"],
  "영덕군": ["영덕읍","강구면","남정면","달산면","지품면","축산면","영해면","병곡면","창수면"],
  "영양군": ["영양읍","입암면","청기면","일월면","수비면","석보면"],
  "예천군": ["예천읍","용문면","효자면","은풍면","감천면","보문면","호명면","유천면","용궁면","개포면","지보면","풍양면"],
  "울릉군": ["울릉읍","서면","북면"],
  "울진군": ["울진읍","평해읍","북면","근남면","온정면","기성면","죽변면","후포면","금강송면","매화면"],
  "의성군": ["의성읍","단촌면","점곡면","옥산면","사곡면","춘산면","가음면","금성면","봉양면","비안면","구천면","단밀면","단북면","안계면","다인면","신평면","안사면"],
  "청도군": ["청도읍","화양읍","풍각면","각남면","이서면","운문면","금천면","매전면"],
  "청송군": ["청송읍","부동면","부남면","현동면","현서면","안덕면","진보면","파천면"],
  "칠곡군": ["왜관읍","북삼읍","석적읍","동명면","가산면","지천면","약목면"],
  "거창군": ["거창읍","주상면","웅양면","고제면","북상면","위천면","마리면","남상면","남하면","신원면","가조면","가북면"],
  "고성군(경남)": ["고성읍","삼산면","하일면","하이면","상리면","대가면","영현면","영오면","개천면","구만면","회화면","마암면","동해면","거류면"],
  "남해군": ["남해읍","이동면","상주면","삼동면","미조면","남면","서면","고현면","설천면","창선면"],
  "산청군": ["산청읍","차황면","오부면","생초면","금서면","삼장면","시천면","단성면","신안면","신등면","생비량면"],
  "의령군": ["의령읍","가례면","칠곡면","대의면","화정면","용덕면","정곡면","지정면","낙서면","부림면","봉수면","궁류면","유곡면"],
  "창녕군": ["창녕읍","남지읍","고암면","성산면","대합면","이방면","유어면","대지면","계성면","영산면","장마면","도천면","길곡면","부곡면"],
  "하동군": ["하동읍","화개면","악양면","적량면","횡천면","고전면","금남면","진교면","양보면","북천면","청암면","옥종면","금성면"],
  "함안군": ["가야읍","칠원읍","함안면","여항면","군북면","법수면","대산면","산인면"],
  "함양군": ["함양읍","마천면","휴천면","유림면","수동면","지곡면","안의면","서하면","서상면","백전면","병곡면"],
  "합천군": ["합천읍","봉산면","야로면","묘산면","가야면","야천면","율곡면","초계면","쌍책면","덕곡면","청덕면","적중면","대양면","쌍백면","삼가면","가회면","대병면","용주면"]
};

const LEVELS = ["초등", "중등", "고등"];
const SUBJECTS = ["국어", "영어", "수학", "사회", "과학", "코딩", "검정고시", "논술"];

// --- 콘텐츠 템플릿 풀 ---

const OPENINGS = [
  (loc, lvl, subj) => `안녕하세요, ${loc} 지역에서 ${lvl}학생 ${subj} 과외를 알아보고 계신 학부모님 또는 학생 여러분! 오늘은 ${loc}에서 ${subj} 과외를 어떻게 시작하면 좋을지, 실제 경험을 바탕으로 상세하게 알려드리려고 합니다. 저도 처음에는 막막했는데, 직접 발로 뛰면서 알게 된 정보들을 정리해 봤어요.`,
  (loc, lvl, subj) => `${loc}에서 ${lvl} ${subj} 과외 찾으시나요? 요즘 ${loc} 학부모님들 사이에서 ${subj} 과외에 대한 관심이 정말 뜨겁더라고요. 주변 맘카페에서도 자주 올라오는 주제인데, 제가 직접 경험하고 정리한 내용을 공유해 드릴게요.`,
  (loc, lvl, subj) => `${lvl}학생 자녀를 둔 학부모님이라면 ${subj} 과외 한 번쯤 고민해 보셨을 거예요. 특히 ${loc} 지역은 교육열이 높아서 좋은 선생님을 찾는 게 쉽지 않은데요. 오늘은 ${loc}에서 ${subj} 과외를 효과적으로 찾는 방법을 알려드릴게요.`,
  (loc, lvl, subj) => `혹시 ${loc}에서 ${lvl} ${subj} 과외를 알아보고 계시다면, 이 글이 큰 도움이 될 거예요. 과외비 시세부터 좋은 선생님 고르는 법, 실제 수업 후기까지 꼼꼼하게 정리했거든요. 저도 아이 과외를 시작하면서 이런 정보가 있었으면 했는데, 없어서 직접 만들었습니다.`,
  (loc, lvl, subj) => `${loc} ${lvl} ${subj} 과외, 어디서부터 시작해야 할지 고민이시죠? 저도 같은 고민을 했던 학부모로서, ${loc} 지역 과외 시장의 현실적인 이야기를 들려드리겠습니다. 읽고 나시면 훨씬 명확한 기준이 생기실 거예요.`,
  (loc, lvl, subj) => `요즘 ${loc}에서 ${subj} 과외 수요가 크게 늘었다는 거 아시나요? ${lvl}학생 학부모님들 사이에서 입소문이 퍼지면서, 검증된 선생님을 찾기가 더 어려워졌다고 해요. 이 글에서는 ${loc} 지역 ${subj} 과외의 모든 것을 정리해 드릴게요.`,
  (loc, lvl, subj) => `${loc}에 사시면서 ${lvl} 자녀의 ${subj} 실력이 걱정되시나요? 학원을 보내자니 시간이 안 맞고, 과외를 알아보자니 정보가 부족하고... 이런 고민을 하고 계셨다면 제가 도움을 드릴 수 있을 것 같아요. ${loc} 지역 ${subj} 과외에 대해 하나하나 알려드릴게요.`,
  (loc, lvl, subj) => `아이의 ${subj} 성적이 걱정되시는 ${loc} 학부모님, 반갑습니다! ${lvl} 시기는 학습 습관이 정말 중요한 때인데요. ${loc}에서 어떤 ${subj} 과외가 우리 아이에게 맞을지, 꼼꼼하게 비교해 보겠습니다.`,
  (loc, lvl, subj) => `이 글을 클릭하신 분이라면 아마 ${loc}에서 믿을 만한 ${lvl} ${subj} 과외 선생님을 찾고 계시는 분일 거예요. 과외는 선생님과의 궁합이 정말 중요한데, 좋은 선생님을 만나려면 어떤 점을 확인해야 하는지 실제 사례와 함께 설명해 드리겠습니다.`,
  (loc, lvl, subj) => `${loc} ${subj} 과외 정보, 한 곳에 다 모았습니다! ${lvl}학생에게 딱 맞는 과외를 찾으시는 분들을 위해 비용, 커리큘럼, 선생님 선택 기준까지 총정리해 봤어요. 실제로 ${loc} 지역에서 과외를 진행한 분들의 이야기도 담았으니 끝까지 읽어보세요.`,
  (loc, lvl, subj) => `${loc}에서 아이 교육에 진심이신 분들 많으시죠? 오늘은 ${lvl} ${subj} 과외를 효과적으로 진행하는 방법에 대해 이야기해 볼까 해요. 단순히 과외 선생님만 구하는 게 아니라, 아이 성적을 실질적으로 올릴 수 있는 전략을 알려드릴게요.`,
  (loc, lvl, subj) => `${loc} 지역 맘카페에서 ${subj} 과외 관련 글이 자주 올라오는 거 보셨을 거예요. ${lvl} 시기에 ${subj} 기초를 잘 잡아놔야 이후 학습이 수월해지거든요. 오늘은 ${loc}에서 ${subj} 과외를 시작하기 전에 꼭 알아야 할 것들을 정리해 봤습니다.`,
  (loc, lvl, subj) => `솔직히 말씀드리면, ${loc}에서 좋은 ${lvl} ${subj} 과외를 찾는 건 쉽지 않아요. 하지만 몇 가지 핵심만 알면 훨씬 수월해집니다. 제가 직접 여러 과외 선생님을 만나보고 느낀 점들을 공유할 테니, 선택하실 때 참고해 주세요.`,
  (loc, lvl, subj) => `${loc}에서 ${lvl}학생 ${subj} 과외를 알아보는 것, 생각보다 신경 쓸 게 많죠? 과외비는 적정한지, 선생님 실력은 검증이 되는지, 우리 아이랑 잘 맞을지... 하나하나 체크해야 할 것들을 리스트로 만들어서 정리해 봤어요.`,
  (loc, lvl, subj) => `안녕하세요! ${loc}에서 ${subj} 과외를 시작한 지 벌써 6개월이 넘었는데요. ${lvl} 아이의 성적 변화와 함께, 과외를 시작하기 전에 알았으면 좋았을 것들을 모두 적어봤어요. ${loc} 지역 학부모님들께 도움이 되었으면 합니다.`,
];

const SUBJECT_CONTENT = {
  "국어": {
    why: [
      "국어는 모든 과목의 기본이 되는 과목이에요. 지문을 이해하는 능력, 글을 쓰는 능력은 다른 과목 성적에도 직접적인 영향을 미칩니다.",
      "국어 실력은 하루아침에 늘지 않아요. 꾸준한 독서와 함께 체계적인 문법, 독해 훈련이 필요한 과목이죠.",
      "요즘 수능 국어가 정말 어려워졌다는 거 다들 느끼고 계실 거예요. 비문학 지문의 난이도가 높아지면서 독해력의 중요성이 더욱 커졌습니다.",
    ],
    tip: [
      "국어 과외에서 가장 중요한 건 아이의 독해력 수준을 정확히 파악하는 거예요. 좋은 선생님은 첫 수업에서 아이의 수준을 테스트하고, 그에 맞는 맞춤 커리큘럼을 짜줍니다.",
      "국어 과외를 고를 때는 문학과 비문학을 균형 있게 다루는지 확인하세요. 한쪽에만 치우친 수업은 실력 향상에 한계가 있어요.",
      "국어 과외 선생님을 선택할 때, 서술형 문제 첨삭 경험이 많은 분을 추천드려요. 요즘 시험에서 서술형 비중이 점점 높아지고 있거든요.",
    ],
    method: [
      "효과적인 국어 공부법은 매일 30분 이상 독서를 하면서, 주 2~3회 과외 수업에서 문제 풀이와 첨삭을 병행하는 거예요. 선생님이 아이의 약점을 정확히 짚어주면 성적 향상 속도가 빨라집니다.",
      "국어 과외에서는 지문 분석 능력을 키우는 게 핵심이에요. 선생님과 함께 지문을 읽고, 구조를 파악하고, 핵심 논지를 정리하는 연습을 반복하면 실력이 눈에 띄게 좋아집니다.",
    ]
  },
  "영어": {
    why: [
      "영어는 글로벌 시대에 필수적인 과목이죠. 단순히 시험 성적뿐만 아니라, 앞으로의 진로에도 큰 영향을 미치는 과목이에요.",
      "영어는 언어 과목이라 어릴 때부터 꾸준히 노출되는 게 중요해요. 과외를 통해 말하기, 듣기, 읽기, 쓰기를 균형 있게 발전시킬 수 있습니다.",
      "내신 영어와 수능 영어는 접근법이 다르다는 거 아시죠? 과외를 통해 각 시험에 맞는 전략을 배우는 게 효율적이에요.",
    ],
    tip: [
      "영어 과외 선생님을 고를 때는 발음보다 문법과 독해 지도 능력을 우선으로 보세요. 특히 시험 대비라면 정확한 문법 설명 능력이 중요합니다.",
      "좋은 영어 과외 선생님은 아이의 수준에 맞는 원서나 영어 지문을 준비해 와요. 교과서만 반복하는 수업은 피하시는 게 좋습니다.",
      "영어 과외에서는 단어 암기 관리를 꼼꼼히 해주는 선생님이 좋아요. 매 수업 시작 전 단어 테스트를 하는 선생님이라면 신뢰할 수 있습니다.",
    ],
    method: [
      "영어 과외의 핵심은 반복 노출이에요. 주 2~3회 수업에서 문법과 독해를 배우고, 나머지 날에는 영어 듣기와 단어 암기를 꾸준히 하는 패턴이 가장 효과적입니다.",
      "영어 성적을 빠르게 올리고 싶다면, 기출문제 분석이 중요해요. 좋은 과외 선생님은 시험 출제 패턴을 분석해서 자주 나오는 유형을 집중적으로 훈련시켜 줍니다.",
    ]
  },
  "수학": {
    why: [
      "수학은 누적형 과목이에요. 앞 단원을 이해하지 못하면 다음 단원도 막히기 때문에, 빈 곳을 정확히 찾아서 채워주는 과외가 효과적입니다.",
      "수학 성적은 자신감과 직결돼요. 한 번 자신감을 잃으면 회복이 어렵기 때문에, 수준에 맞는 맞춤 과외로 작은 성공 경험을 쌓아주는 게 중요합니다.",
      "수학은 혼자 공부하기 어려운 과목 중 하나예요. 막히는 문제를 바로 질문하고 해결할 수 있는 과외 환경이 학원보다 유리한 경우가 많습니다.",
    ],
    tip: [
      "수학 과외 선생님은 풀이 과정을 여러 가지 방법으로 설명할 수 있는 분이 좋아요. 한 가지 풀이법만 고집하는 선생님은 아이의 이해도에 맞추기 어렵습니다.",
      "수학 과외를 시작하기 전에, 아이가 어느 단원부터 막히는지 정확히 진단하는 게 중요해요. 좋은 선생님은 첫 수업에서 진단 테스트를 진행합니다.",
      "수학은 연습량이 중요해요. 과외 수업 외에 충분한 숙제를 내주고, 다음 수업에서 꼼꼼히 확인해주는 선생님을 선택하세요.",
    ],
    method: [
      "수학 과외에서 가장 효과적인 방법은 개념 설명 → 기본 문제 → 응용 문제 → 오답 정리 순서로 진행하는 거예요. 이 과정을 반복하면 실력이 탄탄해집니다.",
      "수학은 오답 노트가 정말 중요해요. 과외 선생님과 함께 틀린 문제를 분석하고, 왜 틀렸는지 기록하면 같은 실수를 반복하지 않게 됩니다.",
    ]
  },
  "사회": {
    why: [
      "사회 과목은 암기만으로는 한계가 있어요. 개념을 이해하고 다양한 사례에 적용할 수 있는 능력이 필요하죠. 과외를 통해 체계적으로 정리하면 시험에서 훨씬 유리합니다.",
      "사회는 넓은 범위를 효율적으로 공부해야 하는 과목이에요. 과외를 통해 핵심 개념을 빠르게 잡고, 자주 출제되는 유형을 연습하는 게 효과적입니다.",
      "요즘 사회 시험은 단순 암기보다 자료 분석 능력을 요구해요. 그래프, 도표, 지도 등을 해석하는 연습을 과외에서 집중적으로 하면 성적이 크게 오릅니다.",
    ],
    tip: [
      "사회 과외 선생님은 시사 이슈와 교과 내용을 연결해서 설명할 수 있는 분이 좋아요. 살아있는 예시로 배우면 기억에 오래 남거든요.",
      "사회 과외에서는 마인드맵이나 개념 정리 노트를 활용하는 선생님을 추천해요. 체계적인 정리가 사회 과목 성적의 핵심이에요.",
    ],
    method: [
      "사회 과외에서 효과적인 학습법은 핵심 개념 정리 → 기출문제 풀이 → 오답 분석 → 심화 자료 해석 순서입니다. 특히 자료 해석 능력을 키우면 고난도 문제도 거뜬해져요.",
      "사회는 스토리텔링 방식으로 공부하면 효과가 좋아요. 역사적 사건이나 사회 현상을 이야기처럼 풀어내는 선생님과 공부하면 재미있게 배울 수 있습니다.",
    ]
  },
  "과학": {
    why: [
      "과학은 실험과 관찰, 논리적 사고를 동시에 요구하는 과목이에요. 개념을 정확히 이해하고 문제에 적용하는 연습이 필요한데, 과외에서 1:1로 배우면 훨씬 효율적이에요.",
      "과학은 물리, 화학, 생물, 지구과학 각 영역마다 접근법이 달라요. 과외를 통해 아이가 약한 영역을 집중 공략할 수 있다는 게 큰 장점이죠.",
      "과학 실력은 개념 이해가 전부가 아니에요. 실험 결과를 분석하고, 그래프를 해석하고, 논리적으로 설명할 수 있어야 좋은 성적이 나와요.",
    ],
    tip: [
      "과학 과외 선생님은 실험 원리를 쉽게 설명해줄 수 있는 분이 좋아요. 단순 공식 암기가 아니라 왜 그런 결과가 나오는지 이해시켜주는 선생님을 찾으세요.",
      "과학 과외를 고를 때는 아이가 배우는 교과서 버전을 잘 아는 선생님인지 확인하세요. 출판사마다 다루는 실험이나 예시가 다를 수 있거든요.",
    ],
    method: [
      "과학 과외의 황금 패턴은 개념 설명 → 실험 원리 이해 → 문제 풀이 → 오답 분석이에요. 특히 실험 원리를 정확히 이해하면 응용 문제도 쉽게 풀 수 있습니다.",
      "과학 공부는 그림 그리기가 효과적이에요. 과외 수업에서 개념을 그림으로 정리하는 습관을 들이면, 복잡한 과정도 한눈에 파악할 수 있게 됩니다.",
    ]
  },
  "코딩": {
    why: [
      "코딩 교육은 이제 선택이 아닌 필수가 됐어요. 2025년부터 초중고 소프트웨어 교육이 강화되면서, 미리 준비하는 학생들이 크게 늘었습니다.",
      "코딩은 논리적 사고력과 문제 해결 능력을 키우는 데 최고의 과목이에요. 수학이나 과학 실력 향상에도 간접적으로 도움이 됩니다.",
      "AI 시대에 코딩을 배우는 것은 미래를 준비하는 가장 확실한 투자예요. 단순히 프로그래밍 기술을 넘어서 창의적 사고력까지 키울 수 있습니다.",
    ],
    tip: [
      "코딩 과외 선생님은 아이의 수준에 맞는 언어를 선택하는 게 중요해요. 초등학생은 스크래치나 엔트리, 중고등학생은 파이썬으로 시작하는 게 좋습니다.",
      "좋은 코딩 과외 선생님은 프로젝트 기반으로 수업해요. 게임 만들기, 앱 만들기 같은 프로젝트를 통해 배우면 아이가 흥미를 잃지 않아요.",
      "코딩 과외에서는 직접 코드를 작성하는 시간이 충분해야 해요. 선생님이 설명만 하고 학생은 듣기만 하는 수업은 효과가 떨어집니다.",
    ],
    method: [
      "코딩 과외에서 가장 효과적인 방법은 작은 프로젝트를 완성하는 거예요. 간단한 계산기 만들기부터 시작해서 점점 난이도를 높여가면 자연스럽게 실력이 향상됩니다.",
      "코딩은 에러를 고치는 과정에서 실력이 가장 많이 늘어요. 과외 수업에서 디버깅하는 방법을 체계적으로 배우면 혼자서도 문제를 해결할 수 있게 됩니다.",
    ]
  },
  "검정고시": {
    why: [
      "검정고시는 학력 인정을 받기 위한 중요한 시험이에요. 체계적인 준비 없이는 합격이 어렵기 때문에, 경험 많은 선생님의 도움이 필요합니다.",
      "검정고시는 범위가 넓고 과목이 많아서 혼자 준비하기 벅차요. 과외를 통해 효율적인 학습 계획을 세우고, 약점을 빠르게 보완하는 게 합격의 지름길이에요.",
      "검정고시 합격은 새로운 시작을 위한 중요한 발판이에요. 대학 진학이든 취업이든, 검정고시 합격 이후의 가능성은 무궁무진합니다.",
    ],
    tip: [
      "검정고시 과외 선생님은 출제 경향을 잘 아는 분이 좋아요. 자주 나오는 유형을 집중 공략하면 합격 확률이 크게 높아집니다.",
      "검정고시 과외에서 가장 중요한 건 시간 관리예요. 과목별 배점과 난이도를 고려해서 전략적으로 공부 시간을 배분하는 게 핵심입니다.",
      "검정고시 준비할 때 기출문제 분석이 정말 중요해요. 최근 5년간 기출문제를 완벽히 분석하면 합격은 어렵지 않습니다.",
    ],
    method: [
      "검정고시 과외에서 효과적인 학습 전략은 기출문제 분석 → 취약 과목 집중 → 모의고사 반복 → 실전 연습 순서예요. 특히 기출문제에서 반복 출제되는 개념을 완벽히 익히는 게 중요합니다.",
      "검정고시는 과목 수가 많으니까, 과외에서는 점수를 가장 빨리 올릴 수 있는 과목부터 집중하는 게 좋아요. 선생님과 함께 우선순위를 정하고 전략적으로 접근하세요.",
    ]
  },
  "논술": {
    why: [
      "논술은 대입에서 중요한 비중을 차지하는 전형이에요. 특히 상위권 대학을 목표로 한다면 논술 준비는 필수입니다.",
      "논술은 단순히 글을 잘 쓰는 것을 넘어서 비판적 사고력과 논리적 표현력을 요구해요. 혼자 공부하기 어렵고, 전문가의 첨삭과 피드백이 반드시 필요한 영역이에요.",
      "논술 실력은 체계적인 훈련 없이는 향상되기 어려워요. 제시문 분석, 논리 구성, 글쓰기까지 모든 과정에서 전문적인 지도가 필요합니다.",
    ],
    tip: [
      "논술 과외 선생님은 첨삭 경험이 풍부한 분이 좋아요. 단순히 '잘 썼다, 못 썼다'가 아니라 구체적인 개선점을 제시해줄 수 있어야 합니다.",
      "좋은 논술 과외 선생님은 다양한 주제에 대한 배경지식을 갖추고 있어요. 인문, 사회, 과학 등 여러 분야의 제시문을 다뤄본 경험이 있는지 확인하세요.",
      "논술 과외에서는 실제 시간 내에 글을 쓰는 연습이 중요해요. 시간 제한 없이 쓰는 것과 제한 시간 안에 쓰는 것은 완전히 다르거든요.",
    ],
    method: [
      "논술 과외에서 가장 효과적인 학습법은 제시문 분석 → 개요 작성 → 글쓰기 → 첨삭 → 재작성 순서예요. 특히 첨삭 후 재작성하는 과정에서 실력이 가장 많이 향상됩니다.",
      "논술은 많이 읽고 많이 쓰는 게 답이에요. 과외 수업에서 매주 1편 이상의 글을 쓰고, 선생님의 꼼꼼한 첨삭을 받으면 3개월 정도면 눈에 띄는 변화가 있습니다.",
    ]
  }
};

const LEVEL_CONTENT = {
  "초등": {
    char: [
      "초등학생 시기는 학습 습관을 형성하는 가장 중요한 때예요. 이때 올바른 공부 습관을 잡아주면 중학교, 고등학교에서도 큰 힘이 됩니다.",
      "초등학생은 집중 시간이 짧기 때문에, 재미있고 다양한 활동을 통해 배우는 게 효과적이에요. 좋은 과외 선생님은 이 점을 잘 이해하고 수업에 반영합니다.",
    ],
    price: "초등학생 과외비는 보통 시간당 2만 5천원~4만원 선이에요. 과목과 선생님 경력에 따라 차이가 있지만, 이 범위 안에서 찾으시면 적정 가격입니다.",
    duration: "초등학생은 주 2~3회, 회당 60~90분 수업이 적당해요. 너무 긴 수업은 오히려 집중력이 떨어질 수 있으니 적정 시간을 지키는 게 중요합니다.",
  },
  "중등": {
    char: [
      "중학생 시기는 기초를 탄탄히 다지는 때예요. 고등학교 내신과 수능을 위한 기반이 되는 시기이므로, 빈틈없이 학습하는 게 중요합니다.",
      "중학생은 사춘기와 맞물려 학습 의욕이 떨어질 수 있어요. 이때 좋은 과외 선생님은 멘토 역할도 함께 해주어 동기부여에 큰 도움이 됩니다.",
    ],
    price: "중학생 과외비는 보통 시간당 3만원~5만원 선이에요. 내신 대비나 특목고 준비의 경우 좀 더 높을 수 있지만, 이 범위를 크게 벗어나면 한 번 더 확인해 보세요.",
    duration: "중학생은 주 2~3회, 회당 90~120분 수업이 효과적이에요. 시험 기간에는 추가 수업을 고려하시는 것도 좋습니다.",
  },
  "고등": {
    char: [
      "고등학생은 내신과 수능을 동시에 준비해야 하는 가장 중요한 시기예요. 효율적인 시간 관리와 전략적인 학습이 필수적입니다.",
      "고등학생에게 과외는 단순한 수업이 아니라 입시 전략 파트너예요. 성적 분석, 취약점 보완, 시험 전략까지 종합적으로 관리받을 수 있습니다.",
    ],
    price: "고등학생 과외비는 보통 시간당 4만원~7만원 선이에요. 수능 대비나 논술 준비의 경우 전문 강사를 찾으시면 그 이상일 수도 있습니다.",
    duration: "고등학생은 주 2~4회, 회당 120분 이상 수업이 일반적이에요. 특히 시험 전에는 집중 수업을 통해 마무리하는 게 효과적입니다.",
  }
};

const REVIEW_TEMPLATES = [
  (loc, lvl, subj) => `저도 ${loc}에서 아이 ${subj} 과외를 시작한 지 4개월 정도 됐는데, 정말 만족하고 있어요. 처음에는 반신반의했는데, 아이 성적이 눈에 띄게 올랐거든요. 특히 선생님이 아이의 약점을 정확히 파악해서 맞춤 수업을 해주시는 게 좋았어요.`,
  (loc, lvl, subj) => `주변에 ${loc} 학부모님들한테 물어보니, ${subj} 과외 만족도가 꽤 높더라고요. 학원보다 시간 조절이 자유롭고, 아이 수준에 딱 맞는 수업이 가능하다는 게 가장 큰 장점이라고 하세요.`,
  (loc, lvl, subj) => `솔직히 과외비가 부담이 됐는데, 아이의 ${subj} 성적이 한 달 만에 15점이나 올랐어요. ${loc}에서 좋은 선생님 만나는 게 쉽지 않다고 들었는데, 저는 운이 좋았나 봐요.`,
  (loc, lvl, subj) => `${loc}에서 ${lvl} ${subj} 과외를 시작한 이유는 학원에서 성적이 안 올라서였어요. 1:1 수업으로 바꾸니까 아이가 모르는 부분을 바로바로 질문할 수 있어서 이해도가 확 높아졌어요.`,
  (loc, lvl, subj) => `과외 선생님이 매 수업 후에 카톡으로 수업 내용과 아이 상태를 알려주시는데, 이게 정말 좋아요. ${loc}에서 이렇게 꼼꼼한 선생님 찾기 쉽지 않거든요.`,
  (loc, lvl, subj) => `처음에 아이가 ${subj}를 정말 싫어했는데, 과외를 시작하고 나서 흥미가 생겼다고 하더라고요. 역시 선생님과의 궁합이 중요한 것 같아요. ${loc}에서 좋은 선생님 만나면 아이의 태도까지 달라져요.`,
  (loc, lvl, subj) => `${loc}에서 과외 선생님 세 분을 만나봤는데, 체험 수업을 해보니 차이가 크더라고요. 꼭 체험 수업을 먼저 해보시고 결정하세요. 아이와의 호흡이 맞아야 장기적으로 효과가 좋아요.`,
  (loc, lvl, subj) => `우리 아이가 ${lvl}학생인데, ${subj} 과외 시작한 후로 자신감이 많이 붙었어요. 성적도 물론 올랐지만, 무엇보다 공부에 대한 두려움이 줄어든 게 가장 큰 성과라고 생각해요.`,
  (loc, lvl, subj) => `${loc} 맘카페에서 추천받은 ${subj} 과외 선생님인데, 정말 소문대로 잘 가르치시더라고요. 아이 눈높이에 맞춰서 설명해 주시고, 숙제 양도 적절해서 아이가 부담 없이 다니고 있어요.`,
  (loc, lvl, subj) => `과외를 시작하기 전에 고민을 많이 했는데, 지금은 더 일찍 시작할 걸 그랬다는 생각이 들어요. ${loc}에서 ${subj} 과외를 고민하고 계신 분이 있다면, 일단 체험 수업부터 받아보시라고 말씀드리고 싶어요.`,
];

const CLOSING_TEMPLATES = [
  (loc, lvl, subj) => `${loc}에서 ${lvl} ${subj} 과외를 찾고 계신 분들께 이 글이 도움이 되었으면 좋겠습니다. 과외는 선생님과의 궁합이 가장 중요하니까, 여러 선생님을 만나보시고 우리 아이에게 딱 맞는 분을 찾으시길 바랍니다. 좋은 결과 있으시길 응원합니다!`,
  (loc, lvl, subj) => `여기까지 ${loc} ${lvl} ${subj} 과외에 대해 알아봤는데요. 궁금한 점이 있으시면 댓글로 남겨주세요. 아는 범위 내에서 성심껏 답변 드리겠습니다. 모든 학생들이 좋은 선생님을 만나 실력이 쑥쑥 오르길 바랍니다!`,
  (loc, lvl, subj) => `오늘 공유한 정보가 ${loc}에서 ${subj} 과외를 찾는 분들께 실질적인 도움이 되었으면 해요. 과외 선택은 신중하게, 하지만 너무 오래 고민하지 마시고 일단 체험 수업부터 시작해 보세요. 화이팅입니다!`,
  (loc, lvl, subj) => `${loc} 지역에서 ${lvl} ${subj} 과외를 준비하시는 모든 분들을 응원합니다. 아이의 교육에 관심을 가지고 이렇게 정보를 찾아보시는 것 자체가 정말 대단하신 거예요. 좋은 선생님과 함께 아이의 실력이 쑥쑥 올라가길 바랍니다.`,
  (loc, lvl, subj) => `지금까지 ${loc} ${lvl} ${subj} 과외에 대한 종합 가이드를 알려드렸어요. 이 글이 과외 선택에 도움이 되셨다면 주변 학부모님들에게도 공유해 주세요. 더 궁금한 점이 있으시면 언제든지 물어봐 주세요!`,
];

const EXTRA_PARAGRAPHS = [
  (loc, lvl, subj) => `참고로 ${loc} 지역의 과외 시장은 계절에 따라 변동이 있어요. 보통 방학 시즌에 과외 수요가 급증하기 때문에, 미리 선생님을 알아보시는 게 좋습니다. 개학 후에 급하게 찾으면 선택지가 줄어들 수 있어요.`,
  (loc, lvl, subj) => `과외를 시작할 때 계약서를 꼭 작성하세요. 수업 일정, 과외비, 환불 규정 등을 명확히 해두면 나중에 분쟁을 예방할 수 있어요. ${loc}에서도 이런 부분을 꼼꼼히 챙기시는 학부모님들이 많아지고 있습니다.`,
  (loc, lvl, subj) => `온라인 과외도 고려해 보세요. ${loc}에서 원하는 선생님을 찾기 어렵다면, 화상 수업으로 전국의 실력 있는 선생님과 연결될 수 있어요. 최근에는 태블릿과 전자 필기 도구가 발전해서 온라인 수업의 질도 많이 좋아졌습니다.`,
  (loc, lvl, subj) => `과외 효과를 높이려면 부모님의 역할도 중요해요. 수업 후에 아이와 오늘 배운 내용에 대해 간단히 대화해 보세요. 아이가 설명하려고 노력하는 과정에서 학습 효과가 배가 됩니다.`,
  (loc, lvl, subj) => `${loc} 지역에는 과외 중개 플랫폼을 통해 선생님을 찾는 분들도 많아요. 숨은고수, 김과외 같은 앱을 활용하면 프로필과 리뷰를 확인할 수 있어서 선택에 도움이 됩니다. 다만, 플랫폼 수수료가 있을 수 있으니 직접 구하는 것과 비교해 보세요.`,
  (loc, lvl, subj) => `${lvl}학생의 ${subj} 학습에서 가장 흔한 실수는 기초를 건너뛰고 어려운 문제만 풀려는 거예요. 과외 선생님과 함께 기초부터 차근차근 다지면 결국 더 빨리 실력이 늘어요. 급하게 생각하지 마시고 꾸준히 해주세요.`,
  (loc, lvl, subj) => `과외 수업 중에 아이가 질문을 잘 안 한다면, 선생님에게 미리 말씀해 두세요. 좋은 선생님은 아이가 질문할 수 있는 편안한 분위기를 만들어 주실 거예요. ${subj}는 특히 모르는 걸 넘어가면 안 되는 과목이거든요.`,
  (loc, lvl, subj) => `${loc}에서 과외를 하면서 학원도 병행하는 분들이 있는데, 비용과 시간을 고려해서 하나에 집중하는 게 효율적인 경우가 많아요. 과외의 장점은 1:1 맞춤 수업이므로, 학원에서 부족한 부분을 보충하는 방식으로 활용하시는 것도 좋습니다.`,
  (loc, lvl, subj) => `과외 선생님과의 첫 만남에서 꼭 확인하실 사항이 있어요. 수업 방식, 교재 선정 기준, 숙제량, 시험 대비 방법 등을 구체적으로 물어보세요. 명확한 답변을 하시는 선생님이라면 수업도 체계적으로 진행하실 확률이 높습니다.`,
  (loc, lvl, subj) => `마지막으로 한 가지 팁을 드리자면, 과외 선생님의 학력보다 교수법이 더 중요해요. 명문대 출신이라도 가르치는 스킬이 부족할 수 있고, 반대로 교육학을 전공한 선생님이 훨씬 효과적일 수 있거든요.`,
];

// --- 태그 생성 ---
function generateTags(location, level, subject, rng) {
  const baseTags = [
    `${location}${subject}과외`, `${location}${level}과외`, `${level}${subject}과외`,
    `${location}과외추천`, `${subject}과외비용`, `${level}${subject}`, `${location}학원`,
    `${subject}공부법`, `${location}교육`, `${level}과외추천`, `${subject}과외추천`,
    `${location}${level}${subject}`, `1대1${subject}과외`, `${location}개인과외`,
    `${subject}성적올리기`, `${level}학생과외`, `${location}과외비`,
  ];
  return pickN(baseTags, 10, rng);
}

// --- 썸네일 SVG 생성 ---
function generateThumbnail(location, level, subject) {
  const colors = {
    "국어": "#E74C3C", "영어": "#3498DB", "수학": "#2ECC71", "사회": "#F39C12",
    "과학": "#9B59B6", "코딩": "#1ABC9C", "검정고시": "#E67E22", "논술": "#34495E"
  };
  const color = colors[subject] || "#3498DB";
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#2C3E50;stop-opacity:1"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <circle cx="1050" cy="120" r="80" fill="rgba(255,255,255,0.1)"/>
    <circle cx="150" cy="500" r="120" fill="rgba(255,255,255,0.05)"/>
    <rect x="80" y="80" width="1040" height="470" rx="20" fill="rgba(255,255,255,0.1)"/>
    <text x="600" y="240" font-family="sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">${location}</text>
    <text x="600" y="340" font-family="sans-serif" font-size="56" fill="rgba(255,255,255,0.9)" text-anchor="middle">${level} ${subject} 과외</text>
    <line x1="450" y1="380" x2="750" y2="380" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
    <text x="600" y="440" font-family="sans-serif" font-size="32" fill="rgba(255,255,255,0.7)" text-anchor="middle">맞춤 교육 · 성적 향상 · 1:1 수업</text>
    <text x="600" y="510" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.5)" text-anchor="middle">anhani.com</text>
  </svg>`;
}

// --- 콘텐츠 생성 ---
function generateContent(location, level, subject, parentRegion) {
  const seed = hashCode(`${location}-${level}-${subject}`);
  const rng = seededRandom(seed);
  
  const subj = SUBJECT_CONTENT[subject];
  const lvl = LEVEL_CONTENT[level];
  
  const opening = pick(OPENINGS, rng)(location, level, subject);
  const why = pick(subj.why, rng);
  const tip = pick(subj.tip, rng);
  const method = pick(subj.method, rng);
  const levelChar = pick(lvl.char, rng);
  const review1 = pick(REVIEW_TEMPLATES, rng)(location, level, subject);
  const review2 = pick(REVIEW_TEMPLATES.filter(t => t !== REVIEW_TEMPLATES[Math.floor(rng() * REVIEW_TEMPLATES.length)]), rng)(location, level, subject);
  const extra1 = pick(EXTRA_PARAGRAPHS, rng)(location, level, subject);
  const extra2 = pick(EXTRA_PARAGRAPHS.filter((_, i) => i !== Math.floor(rng() * EXTRA_PARAGRAPHS.length)), rng)(location, level, subject);
  const closing = pick(CLOSING_TEMPLATES, rng)(location, level, subject);
  const tags = generateTags(location, level, subject, rng);

  const regionDisplay = parentRegion ? `${parentRegion} ${location}` : location;

  const title = `${regionDisplay} ${level} ${subject} 과외 추천 - 비용, 선생님 선택 가이드`;
  const description = `${regionDisplay} ${level}학생 ${subject} 과외 정보를 찾고 계신가요? 과외비, 좋은 선생님 고르는 법, 실제 후기까지 한 번에 정리했습니다.`;

  const bodyHTML = `
    <article>
      <p>${opening}</p>
      
      <h2>${regionDisplay}에서 ${level} ${subject} 과외가 필요한 이유</h2>
      <p>${why}</p>
      <p>${levelChar}</p>
      
      <h2>${subject} 과외 선생님 고르는 핵심 팁</h2>
      <p>${tip}</p>
      <p>${extra1}</p>
      
      <h2>효과적인 ${subject} 과외 학습 방법</h2>
      <p>${method}</p>
      
      <h2>${regionDisplay} ${level} ${subject} 과외비 안내</h2>
      <p>${lvl.price}</p>
      <p>${lvl.duration}</p>
      
      <h2>실제 ${regionDisplay} ${subject} 과외 후기</h2>
      <p>${review1}</p>
      <p>${review2}</p>
      
      <h2>과외 시작 전 꼭 알아두세요</h2>
      <p>${extra2}</p>
      
      <p>${closing}</p>
    </article>
  `;

  return { title, description, bodyHTML, tags };
}

// --- HTML 페이지 렌더링 ---
function renderPage(location, level, subject, parentRegion, url) {
  const { title, description, bodyHTML, tags } = generateContent(location, level, subject, parentRegion);
  const thumbnail = generateThumbnail(location, level, subject);
  const thumbnailDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(thumbnail)))}`;
  const regionDisplay = parentRegion ? `${parentRegion} ${location}` : location;
  const canonical = `https://anhani.com${url}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta name="naver-site-verification" content="2d31a5395d70375a6b80e71c055be5e739383013" />
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | 안하니</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  
  <!-- 네이버 SEO -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${thumbnailDataUri}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="안하니">
  <meta property="og:locale" content="ko_KR">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${description}",
    "author": { "@type": "Organization", "name": "안하니" },
    "publisher": { "@type": "Organization", "name": "안하니", "url": "https://anhani.com" },
    "mainEntityOfPage": "${canonical}"
  }
  </script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.8; color: #333; background: #f9fafb; }
    .header { background: #fff; border-bottom: 1px solid #e5e7eb; padding: 16px 0; }
    .header-inner { max-width: 768px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; }
    .logo { font-size: 24px; font-weight: 800; color: #111; text-decoration: none; }
    .nav a { color: #666; text-decoration: none; margin-left: 20px; font-size: 14px; }
    .container { max-width: 768px; margin: 0 auto; padding: 32px 20px; }
    .breadcrumb { font-size: 13px; color: #888; margin-bottom: 16px; }
    .breadcrumb a { color: #888; text-decoration: none; }
    .breadcrumb a:hover { color: #333; }
    .thumbnail { width: 100%; border-radius: 12px; margin-bottom: 24px; }
    h1 { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 12px; line-height: 1.4; }
    .meta { font-size: 13px; color: #999; margin-bottom: 32px; }
    article h2 { font-size: 22px; font-weight: 700; color: #111; margin: 36px 0 16px; padding-left: 12px; border-left: 4px solid #3b82f6; }
    article p { font-size: 16px; margin-bottom: 16px; word-break: keep-all; }
    .tags { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
    .tags h3 { font-size: 14px; color: #666; margin-bottom: 12px; }
    .tag { display: inline-block; background: #f3f4f6; color: #555; padding: 6px 14px; border-radius: 20px; font-size: 13px; margin: 0 6px 8px 0; text-decoration: none; }
    .tag:hover { background: #e5e7eb; }
    .footer { background: #111; color: #999; padding: 40px 20px; margin-top: 60px; text-align: center; font-size: 13px; }
    .footer a { color: #ccc; text-decoration: none; }
    @media (max-width: 640px) { h1 { font-size: 22px; } article h2 { font-size: 18px; } }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="/" class="logo">안하니</a>
      <nav class="nav">
        <a href="/">홈</a>
      </nav>
    </div>
  </header>
  
  <main class="container">
    <div class="breadcrumb">
      <a href="/">홈</a> &gt; <a href="/#${encodeURIComponent(parentRegion || location)}">${parentRegion || location}</a> &gt; ${regionDisplay} ${level} ${subject} 과외
    </div>
    
    <img src="${thumbnailDataUri}" alt="${regionDisplay} ${level} ${subject} 과외" class="thumbnail" width="1200" height="630">
    
    <h1>${regionDisplay} ${level} ${subject} 과외 추천 가이드</h1>
    <div class="meta">최종 업데이트: 2026년 4월 | 작성자: 안하니 교육팀</div>
    
    ${bodyHTML}
    
    <div class="tags">
      <h3>관련 태그</h3>
      ${tags.map(t => `<a href="/#" class="tag">#${t}</a>`).join('\n      ')}
    </div>
  </main>
  
  <footer class="footer">
    <p>&copy; 2026 <a href="https://anhani.com">안하니</a> | 대한민국 교육 정보 플랫폼</p>
  </footer>
</body>
</html>`;
}

// --- URL 파싱 ---
function parseUrl(pathname) {
  // URL 형식: /지역-학교급-과목-과외
  const decoded = decodeURIComponent(pathname.replace(/^\//, ''));
  if (!decoded) return null;
  
  const parts = decoded.split('-');
  if (parts.length < 4) return null;
  
  const suffix = parts[parts.length - 1]; // "과외"
  if (suffix !== '과외') return null;
  
  const subject = parts[parts.length - 2];
  const level = parts[parts.length - 3];
  const location = parts.slice(0, parts.length - 3).join('-');
  
  if (!SUBJECTS.includes(subject)) return null;
  if (!LEVELS.includes(level)) return null;
  
  return { location, level, subject };
}

// --- 지역 유효성 검증 & 상위 지역 찾기 ---
function findRegion(location) {
  // 시/군/구 찾기
  for (const [parent, districts] of Object.entries(REGIONS)) {
    if (districts.includes(location)) {
      return { valid: true, parentRegion: parent };
    }
  }
  // 읍/면 찾기
  for (const [parent, areas] of Object.entries(EUP_MYEON)) {
    if (areas.includes(location)) {
      // 상위 군 찾기
      for (const [grandParent, districts] of Object.entries(REGIONS)) {
        if (districts.includes(parent)) {
          return { valid: true, parentRegion: `${grandParent} ${parent}` };
        }
      }
      return { valid: true, parentRegion: parent };
    }
  }
  // 광역시/도 자체
  if (REGIONS[location]) {
    return { valid: true, parentRegion: null };
  }
  return { valid: false };
}

// --- 모든 URL 목록 생성 (sitemap용) ---
function getAllUrls() {
  const urls = [];
  
  // 시/군/구
  for (const [parent, districts] of Object.entries(REGIONS)) {
    for (const district of districts) {
      for (const level of LEVELS) {
        for (const subject of SUBJECTS) {
          urls.push(`/${encodeURIComponent(`${district}-${level}-${subject}-과외`)}`);
        }
      }
    }
  }
  
  // 읍/면
  for (const [parent, areas] of Object.entries(EUP_MYEON)) {
    for (const area of areas) {
      for (const level of LEVELS) {
        for (const subject of SUBJECTS) {
          urls.push(`/${encodeURIComponent(`${area}-${level}-${subject}-과외`)}`);
        }
      }
    }
  }
  
  return urls;
}

// --- 사이트맵 생성 ---
function generateSitemap() {
  const urls = getAllUrls();
  const baseUrl = 'https://anhani.com';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
  
  for (const url of urls) {
    xml += `  <url>
    <loc>${baseUrl}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }
  
  xml += `</urlset>`;
  return xml;
}

// --- 사이트맵 인덱스 (큰 사이트맵 분할) ---
function generateSitemapIndex(totalUrls) {
  const URLS_PER_SITEMAP = 10000;
  const numSitemaps = Math.ceil(totalUrls / URLS_PER_SITEMAP);
  const baseUrl = 'https://anhani.com';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (let i = 0; i < numSitemaps; i++) {
    xml += `  <sitemap>
    <loc>${baseUrl}/sitemap-${i}.xml</loc>
  </sitemap>
`;
  }
  xml += `</sitemapindex>`;
  return xml;
}

function generateSitemapPart(part) {
  const URLS_PER_SITEMAP = 10000;
  const allUrls = getAllUrls();
  const start = part * URLS_PER_SITEMAP;
  const end = Math.min(start + URLS_PER_SITEMAP, allUrls.length);
  const urls = allUrls.slice(start, end);
  const baseUrl = 'https://anhani.com';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (const url of urls) {
    xml += `  <url>
    <loc>${baseUrl}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

// --- 공통 레이아웃 ---
function commonHead(title, description, canonical) {
  return `<meta charset="UTF-8">
  <meta name="naver-site-verification" content="2d31a5395d70375a6b80e71c055be5e739383013" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="안하니">
  <meta property="og:locale" content="ko_KR">
  <link rel="canonical" href="${canonical}">`;
}

function commonStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans KR', -apple-system, sans-serif; background: #f8fafc; color: #334155; line-height: 1.7; }
    
    /* 네비게이션 */
    .nav { background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 68px; }
    .nav-logo { text-decoration: none; display: flex; align-items: center; }
    .nav-logo-img { height: 52px; width: auto; }
    .nav-links { display: flex; gap: 0; align-items: center; height: 100%; }
    .nav-item { position: relative; height: 100%; display: flex; align-items: center; }
    .nav-item > a { color: #475569; text-decoration: none; font-size: 15px; font-weight: 500; padding: 8px 14px; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; gap: 4px; }
    .nav-item > a:hover { background: #f1f5f9; color: #6366f1; }
    .nav-item > a.active { color: #6366f1; background: #eef2ff; }
    .nav-item > a .arrow-down { font-size: 10px; opacity: 0.5; }
    .dropdown { display: none; position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px 0; min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .nav-item:hover .dropdown { display: block; }
    .dropdown a { display: block; padding: 8px 20px; color: #475569; text-decoration: none; font-size: 14px; transition: all 0.15s; }
    .dropdown a:hover { background: #f1f5f9; color: #6366f1; }
    .dropdown .divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
    .nav-cta { background: #6366f1; color: #fff !important; border-radius: 8px !important; padding: 8px 20px !important; margin-left: 8px; }
    .nav-cta:hover { background: #4f46e5 !important; }
    .mobile-menu { display: none; background: none; border: none; font-size: 24px; cursor: pointer; }
    
    /* 푸터 */
    .footer { background: #0f172a; color: #94a3b8; padding: 60px 24px 40px; }
    .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 40px; }
    .footer-brand h3 { color: #fff; font-size: 20px; margin-bottom: 12px; }
    .footer-brand p { font-size: 13px; line-height: 1.8; }
    .footer-col h4 { color: #e2e8f0; font-size: 14px; margin-bottom: 16px; font-weight: 600; }
    .footer-col a { display: block; color: #94a3b8; text-decoration: none; font-size: 13px; margin-bottom: 8px; transition: color 0.2s; }
    .footer-col a:hover { color: #fff; }
    .footer-bottom { max-width: 1200px; margin: 40px auto 0; padding-top: 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b; }
    
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .mobile-menu { display: block; }
      .footer-inner { grid-template-columns: 1fr 1fr; gap: 24px; }
    }
  `;
}

function navHTML(activePage) {
  return `<nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-logo"><img src="data:image/png;base64,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54woM9UVlovTb7tv/esu+Orxh+19yokH7rXHvPZCEeJXruu59d4lN912z213LUntZIqK1g0xspQTMsan9e5ppfe/+5XlyHvnCQm01dhJh+tIRttZN5byCakX4gw24jpc7YJXP2/9+r4vfP96W2TLkRcIswhMqUPVLOuVZRs2ggkMiqyZROosOTbUAKdkTKNam5K4733ydUft1Z05MabAI1AibXoCecAcSKcqGA79GJsZt+FnLwrG32954LEn1lNpDnzdat1HxlcGDz9g/nvOf4mqYyWwFdaQVmGFc4OTbfLR95x1221PLO9rmCQ4JxEVJ914+0NPPLFy0a6znR+WAs09bBFwaO6qSurUyVADYnKXEB696+rVeZZA6gDWHGf4B6IvPF2DRaGGmQSwG4aG4CszuzrQrAdSDVQXGe89j0jRU+4VeoNQlSKkDvAgBQOGg1DndqFCebNjDhLXJAQGzZ1avrW+Ic1C6iQzo5pLP4cjlA165H1zCESqqqEaUAfZRMST71yRveM7j5s3Vl91xBwVZjEMCXUnI/rFj+gPthmemQvzsmc2vr9++KEL3/e20yxlSia46S5tzJralUQtiJVaqIh38oE3nX7vfY9cfd3dcdfCzHOkNSFyTm2pveLT31173+/+ujguJuXYipNKzbtMYKKkONmYxGsq7AQe7FgMsqEPv+/8I/eclfnBiIo6upNCKxYZ1jlRhao4t1Vcw4JSK/6/3vviYmf3F77281oa2dJkApOq+qoyUZIQWSJShkpDSJQig3amTsJQOtg3f0b8tY+86UVHLpQsM1GU5850s+WlzbLsHLVt0TJ1C0DQ8O1df9cylxlDEM1CKadm1dOff9iskvW+xogUBI0CsEgEQ+x8Y98Fk1508n7fvvgGU5rkfEZQa6OB/srtDz21aNfZ4jLhJHgLkqsva06eBImXrnac+arnlY3RjIx1DEkHawfts9ACqgyivDhrlKnV0S9aeVzayXZNadNEzdM3WEpQUisi7A2SqvNArUQEIIKElK/Sdhz1pC2hglzLwan6HKxVB0lVAjAABpntNiucN9rWKNcPVoA6S5HzFecYBOF67MsgfjZbE44MWUf7wkGHB6zN9BNB4AED38YAc8WUooE+LF6y4ZVHzgWBPRtxIA+yhLSZM9TNy740iBwRQIbAQIPIItO5U/iVJ+y3Zc98WHZSOYLo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" alt="과외안하니" class="nav-logo-img"></a>
      <div class="nav-links">
        
        <div class="nav-item">
          <a href="/지역별" class="${activePage === 'region' ? 'active' : ''}">전국과외 <span class="arrow-down">▼</span></a>
          <div class="dropdown">
            <a href="/지역별">지역별 과외</a>
            <a href="/학교급별">학년별 과외</a>
            <a href="/학교급별">학교별 과외</a>
          </div>
        </div>
        
        <div class="nav-item">
          <a href="/과목별" class="${activePage === 'subject' ? 'active' : ''}">과목별 <span class="arrow-down">▼</span></a>
          <div class="dropdown">
            <a href="/과목별/국어">국어</a>
            <a href="/과목별/영어">영어</a>
            <a href="/과목별/수학">수학</a>
            <a href="/과목별/사회">사회</a>
            <a href="/과목별/과학">과학</a>
            <a href="/과목별/코딩">코딩</a>
            <a href="/과목별/검정고시">검정고시</a>
          </div>
        </div>
        
        <div class="nav-item">
          <a href="/학원" class="${activePage === 'academy' ? 'active' : ''}">학원 <span class="arrow-down">▼</span></a>
          <div class="dropdown">
            <a href="/학원/전국지점">전국 지점 찾기</a>
          </div>
        </div>
        
        <div class="nav-item">
          <a href="/학습가이드" class="${activePage === 'guide' ? 'active' : ''}">학습가이드</a>
        </div>
        
        <div class="nav-item">
          <a href="/유학" class="${activePage === 'abroad' ? 'active' : ''}">유학</a>
        </div>
        
        <div class="nav-item">
          <a href="/외국어" class="${activePage === 'foreign' ? 'active' : ''}">외국어 <span class="arrow-down">▼</span></a>
          <div class="dropdown">
            <a href="/외국어/영어">영어</a>
            <a href="/외국어/중국어">중국어</a>
            <a href="/외국어/일본어">일본어</a>
          </div>
        </div>
        
        <a href="/상담" class="nav-cta">무료 상담</a>
      </div>
      <button class="mobile-menu" onclick="document.querySelector('.nav-links').style.display=document.querySelector('.nav-links').style.display==='flex'?'none':'flex'">☰</button>
    </div>
  </nav>`;
}

function footerHTML() {
  const regionCols = Object.keys(REGIONS).slice(0, 8);
  return `<footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <h3>안하니</h3>
        <p>전국 시/군/구/읍/면 과외 정보를<br>한 곳에서 확인하세요.<br>초등·중등·고등 맞춤 과외 매칭</p>
      </div>
      <div class="footer-col">
        <h4>과목별 학습</h4>
        ${SUBJECTS.map(s => `<a href="/과목별/${encodeURIComponent(s)}">${s} 과외</a>`).join('')}
      </div>
      <div class="footer-col">
        <h4>지역별 과외</h4>
        ${regionCols.map(r => `<a href="/지역별/${encodeURIComponent(r)}">${r}</a>`).join('')}
      </div>
      <div class="footer-col">
        <h4>학교급별</h4>
        ${LEVELS.map(l => `<a href="/학교급별/${encodeURIComponent(l)}">${l} 과외</a>`).join('')}
        <a href="/과목별/${encodeURIComponent('검정고시')}">검정고시</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 안하니 | 대한민국 과외 정보 플랫폼. All rights reserved.</p>
    </div>
  </footer>`;
}

// --- 홈페이지 ---
function renderHomepage() {
  // 총 페이지 수 계산
  let totalLocations = 0;
  for (const districts of Object.values(REGIONS)) totalLocations += districts.length;
  for (const areas of Object.values(EUP_MYEON)) totalLocations += areas.length;
  const totalPages = totalLocations * LEVELS.length * SUBJECTS.length;

  const regionCards = Object.entries(REGIONS).map(([parent, districts]) => {
    return `<a href="/지역별/${encodeURIComponent(parent)}" class="region-card">
      <div class="region-icon">${parent.charAt(0)}</div>
      <div class="region-info">
        <h3>${parent}</h3>
        <p>${districts.length}개 시/군/구</p>
      </div>
      <span class="arrow">→</span>
    </a>`;
  }).join('');

  const subjectColors = {
    "국어": "#ef4444", "영어": "#3b82f6", "수학": "#22c55e", "사회": "#f59e0b",
    "과학": "#a855f7", "코딩": "#06b6d4", "검정고시": "#f97316", "논술": "#64748b"
  };
  const subjectIcons = {
    "국어": "📖", "영어": "🌍", "수학": "📐", "사회": "🏛️",
    "과학": "🔬", "코딩": "💻", "검정고시": "📝", "논술": "✍️"
  };
  const subjectCards = SUBJECTS.map(s => {
    return `<a href="/과목별/${encodeURIComponent(s)}" class="subject-card" style="--accent:${subjectColors[s]}">
      <span class="subject-icon">${subjectIcons[s]}</span>
      <h3>${s}</h3>
      <p>${s} 과외 정보 보기</p>
    </a>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  ${commonHead('안하니 - 전국 과외 정보 플랫폼', '전국 시/군/구/읍/면 초등, 중등, 고등 과외 정보! 국어, 영어, 수학, 사회, 과학, 코딩, 검정고시, 논술 과외를 찾아보세요.', 'https://anhani.com/')}
  <style>
    ${commonStyles()}
    
    /* 슬라이더 */
    .slider { position: relative; width: 100%; height: 420px; overflow: hidden; }
    .slider-track { display: flex; width: 400%; height: 100%; transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
    .slide { width: 25%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .slide-inner { position: relative; z-index: 2; max-width: 800px; padding: 0 40px; text-align: center; color: #fff; }
    .slide-badge { display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); padding: 6px 20px; border-radius: 20px; font-size: 13px; font-weight: 500; margin-bottom: 20px; }
    .slide h2 { font-size: 42px; font-weight: 900; line-height: 1.3; margin-bottom: 14px; letter-spacing: -1px; text-shadow: 0 2px 16px rgba(0,0,0,0.3); }
    .slide h2 em { font-style: normal; }
    .slide p { font-size: 17px; opacity: 0.9; margin-bottom: 28px; text-shadow: 0 1px 8px rgba(0,0,0,0.3); }
    .slide-btn { display: inline-block; padding: 13px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
    .slide1 { background: linear-gradient(135deg, #1e2a4a 0%, #2a3f6f 40%, #1a2744 100%); }
    .slide1 h2 em { color: #60a5fa; }
    .slide1 .slide-btn { background: #fff; color: #1e3a8a; }
    .slide1 .slide-btn:hover { background: #dbeafe; transform: translateY(-2px); }
    .slide2 { background: linear-gradient(135deg, #4a1942 0%, #2d1035 50%, #1a0a20 100%); }
    .slide2 h2 em { color: #f0abfc; }
    .slide2 .slide-btn { background: #d946ef; color: #fff; }
    .slide2 .slide-btn:hover { background: #c026d3; transform: translateY(-2px); }
    .slide3 { background: linear-gradient(135deg, #3b1a00 0%, #6b3a1f 40%, #2a1200 100%); }
    .slide3 h2 em { color: #fbbf24; }
    .slide3 .slide-btn { background: #f59e0b; color: #1a0a00; }
    .slide3 .slide-btn:hover { background: #d97706; transform: translateY(-2px); }
    .slide4 { background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%); }
    .slide4 h2 em { color: #34d399; }
    .slide4 .slide-btn { background: #10b981; color: #fff; }
    .slide4 .slide-btn:hover { background: #059669; transform: translateY(-2px); }
    .slide::before { content: ''; position: absolute; inset: 0; z-index: 1; }
    .slide1::before { background: radial-gradient(ellipse at 70% 50%, rgba(96,165,250,0.15) 0%, transparent 60%); }
    .slide2::before { background: radial-gradient(ellipse at 50% 50%, rgba(217,70,239,0.15) 0%, transparent 60%); }
    .slide3::before { background: radial-gradient(ellipse at 50% 60%, rgba(251,191,36,0.12) 0%, transparent 60%); }
    .slide4::before { background: radial-gradient(ellipse at 30% 50%, rgba(52,211,153,0.12) 0%, transparent 60%); }
    
    /* 슬라이더 좌우 화살표 */
    .slider-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; cursor: pointer; transition: all 0.2s; }
    .slider-arrow:hover { background: rgba(255,255,255,0.3); }
    .slider-prev { left: 20px; }
    .slider-next { right: 20px; }
    
    /* 슬라이더 인디케이터 */
    .slider-dots { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 10; display: flex; gap: 10px; }
    .slider-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.3s; border: none; }
    .slider-dot.active { background: #fff; width: 28px; border-radius: 5px; }
    
    /* 슬라이드 장식 요소 */
    .slide-deco { position: absolute; z-index: 1; opacity: 0.15; }
    .slide1 .deco1 { top: 20%; right: 10%; width: 180px; height: 180px; border: 3px solid #60a5fa; border-radius: 50%; }
    .slide1 .deco2 { bottom: 15%; left: 8%; width: 100px; height: 100px; background: #60a5fa; border-radius: 16px; transform: rotate(45deg); }
    .slide2 .deco1 { top: 10%; left: 15%; width: 200px; height: 200px; border: 3px solid #f0abfc; border-radius: 50%; }
    .slide3 .deco1 { bottom: 10%; right: 12%; width: 150px; height: 150px; border: 3px solid #fbbf24; border-radius: 50%; }
    .slide4 .deco1 { top: 15%; right: 15%; width: 120px; height: 120px; border: 3px solid #34d399; border-radius: 50%; }
    .slide4 .deco2 { bottom: 20%; left: 10%; width: 80px; height: 80px; background: #34d399; border-radius: 12px; transform: rotate(30deg); }
    
    /* 슬라이드 통계 박스 */
    .slide-stats { position: absolute; right: 40px; top: 50%; transform: translateY(-50%); z-index: 2; display: flex; flex-direction: column; gap: 10px; }
    .slide-stat-box { background: rgba(255,255,255,0.95); border-radius: 12px; padding: 14px 20px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); min-width: 180px; }
    .slide-stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .slide-stat-text { font-size: 11px; color: #64748b; line-height: 1.3; }
    .slide-stat-text strong { display: block; font-size: 15px; color: #0f172a; }

    @media (max-width: 768px) {
      .slider { height: 360px; }
      .slide h2 { font-size: 26px; }
      .slide p { font-size: 14px; }
      .slide-inner { padding: 0 20px; }
      .slider-arrow { width: 36px; height: 36px; font-size: 16px; }
      .slide-stats { display: none; }
      .slide-deco { display: none; }
    }
    
    /* 회원 합격후기 */
    .review-section { background: #f8fafb; padding: 70px 24px 50px; }
    .review-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
    .review-main-title { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 36px; }
    .review-main-title em { font-style: normal; color: #312e81; }
    .review-track-wrap { position: relative; }
    .review-track { display: flex; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding: 4px; }
    .review-track::-webkit-scrollbar { display: none; }
    .rv-card { min-width: 340px; max-width: 340px; flex-shrink: 0; scroll-snap-align: start; background: #fff; border-radius: 16px; padding: 28px 24px; text-align: left; border: 1px solid #e8ebe8; transition: all 0.3s; display: flex; flex-direction: column; }
    .rv-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); transform: translateY(-4px); }
    .rv-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .rv-tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; }
    .rv-stars { color: #facc15; font-size: 14px; letter-spacing: 1px; }
    .rv-text { font-size: 15px; color: #334155; line-height: 1.75; flex: 1; margin-bottom: 20px; }
    .rv-text b { color: #0f172a; font-weight: 700; }
    .rv-author { display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid #eef2ff; }
    .rv-avatar-icon { width: 40px; height: 40px; background: #eef2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .rv-info { text-align: left; }
    .rv-info b { display: block; font-size: 14px; color: #0f172a; margin-bottom: 2px; }
    .rv-info span { font-size: 12px; color: #94a3b8; }
    .rv-nav { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 28px; }
    .rv-arrow { width: 40px; height: 40px; border-radius: 50%; border: 1px solid #d1d5db; background: #fff; color: #475569; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .rv-arrow:hover { border-color: #312e81; color: #312e81; }
    .rv-dots { display: flex; gap: 8px; align-items: center; }
    .rv-dot { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; transition: all 0.3s; }
    .rv-dot.active { width: 10px; height: 10px; background: #312e81; }

    @media (max-width: 768px) {
      .rv-card { min-width: 280px; max-width: 280px; padding: 20px 18px; }
      .rv-text { font-size: 14px; }
      .review-main-title { font-size: 22px; }
    }

    /* OUR STRENGTH */
    .strength-section { background: #fff; padding: 80px 24px; }
    .strength-inner { max-width: 1000px; margin: 0 auto; text-align: center; }
    .section-label-center { font-size: 13px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
    .strength-title { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1.5; margin-bottom: 12px; }
    .strength-title em { font-style: normal; color: #6366f1; }
    .strength-subtitle { font-size: 15px; color: #64748b; line-height: 1.8; margin-bottom: 48px; }
    .strength-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .strength-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px 16px; text-align: center; transition: all 0.3s; }
    .strength-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    .strength-icon { font-size: 36px; margin-bottom: 16px; }
    .strength-sub { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
    .strength-num { font-size: 40px; font-weight: 900; color: #6366f1; margin-bottom: 8px; }
    .strength-unit { font-size: 20px; font-weight: 700; }
    .strength-desc { font-size: 13px; color: #64748b; line-height: 1.6; }

    /* 퍼스널 진단검사 */
    .diagnosis-section { background: #0f172a; padding: 80px 24px; color: #fff; }
    .diagnosis-inner { max-width: 1000px; margin: 0 auto; text-align: center; }
    .diagnosis-title { font-size: 28px; font-weight: 800; line-height: 1.5; margin-bottom: 12px; }
    .diagnosis-title em { font-style: normal; color: #818cf8; }
    .diagnosis-subtitle { font-size: 15px; color: #94a3b8; margin-bottom: 48px; }
    .diagnosis-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .diagnosis-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px 20px; text-align: left; transition: all 0.3s; }
    .diagnosis-card:hover { background: rgba(255,255,255,0.1); transform: translateY(-4px); }
    .diag-num { width: 32px; height: 32px; background: #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; margin-bottom: 14px; }
    .diagnosis-card h4 { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
    .diagnosis-card p { font-size: 13px; color: #94a3b8; line-height: 1.5; }

    /* 선생님 역량 */
    .teacher-section { background: #fff; padding: 80px 24px; }
    .teacher-inner { max-width: 1000px; margin: 0 auto; text-align: center; }
    .teacher-title { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1.5; margin-bottom: 12px; }
    .teacher-title em { font-style: normal; color: #6366f1; }
    .teacher-subtitle { font-size: 15px; color: #64748b; line-height: 1.8; margin-bottom: 48px; }
    .teacher-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .teacher-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px 24px; text-align: left; transition: all 0.3s; }
    .teacher-card:hover { border-color: #6366f1; box-shadow: 0 8px 24px rgba(99,102,241,0.1); transform: translateY(-4px); }
    .teacher-card-num { font-size: 24px; font-weight: 900; color: #6366f1; margin-bottom: 16px; }
    .teacher-card h4 { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .teacher-card p { font-size: 14px; color: #64748b; line-height: 1.7; }

    /* AI 학습시스템 */
    .system-section { background: linear-gradient(135deg, #f0f4ff, #e8ecff); padding: 80px 24px; }
    .system-inner { max-width: 1000px; margin: 0 auto; text-align: center; }
    .system-title { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1.5; margin-bottom: 12px; }
    .system-title em { font-style: normal; color: #6366f1; }
    .system-subtitle { font-size: 15px; color: #64748b; line-height: 1.8; margin-bottom: 36px; }
    .system-sub-heading { font-size: 18px; font-weight: 700; color: #4f46e5; margin-bottom: 32px; }
    .system-steps { display: flex; align-items: stretch; gap: 0; justify-content: center; }
    .system-step { flex: 1; max-width: 280px; background: #fff; border-radius: 16px; padding: 32px 24px; border: 1px solid #e2e8f0; text-align: center; }
    .system-step:hover { border-color: #6366f1; box-shadow: 0 8px 24px rgba(99,102,241,0.1); }
    .step-badge { display: inline-block; background: #6366f1; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
    .system-step h4 { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
    .system-step p { font-size: 13px; color: #64748b; line-height: 1.7; }
    .system-arrow { display: flex; align-items: center; font-size: 24px; color: #6366f1; font-weight: 700; padding: 0 12px; }

    /* 상담 폼 */
    .consult-section { background: #0f172a; padding: 80px 24px; }
    .consult-inner { max-width: 1000px; margin: 0 auto; display: flex; gap: 60px; align-items: center; }
    .consult-left { flex: 1; color: #fff; }
    .consult-left h2 { font-size: 32px; font-weight: 800; line-height: 1.4; margin-bottom: 16px; }
    .consult-left h2 em { font-style: normal; color: #818cf8; }
    .consult-left > p { font-size: 15px; color: #94a3b8; line-height: 1.8; margin-bottom: 24px; }
    .consult-features { display: flex; flex-direction: column; gap: 8px; }
    .consult-feat { font-size: 15px; color: #e2e8f0; }
    .consult-form { flex: 0 0 380px; background: #fff; border-radius: 20px; padding: 36px 28px; }
    .consult-form h3 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 20px; text-align: center; }
    .form-input { display: block; width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 12px; outline: none; transition: border-color 0.2s; background: #f8fafc; }
    .form-input:focus { border-color: #6366f1; }
    .form-submit { display: block; width: 100%; padding: 14px; background: #6366f1; color: #fff; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .form-submit:hover { background: #4f46e5; }
    .form-note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 12px; }

    /* 플로팅 버튼 */
    .floating-btns { position: fixed; right: 24px; bottom: 32px; z-index: 200; display: flex; flex-direction: column; gap: 10px; }
    .float-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 28px; font-size: 14px; font-weight: 700; text-decoration: none; color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.2); transition: all 0.2s; white-space: nowrap; }
    .float-btn:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(0,0,0,0.25); }
    .float-call { background: #22c55e; }
    .float-kakao { background: #fbbf24; color: #1a1a1a; }
    .float-free { background: #6366f1; }

    @media (max-width: 768px) {
      .floating-btns { right: 12px; bottom: 16px; gap: 8px; }
      .float-btn { padding: 10px 16px; font-size: 13px; }
    }

    .stats { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 10; }
    .stats-grid { display: none; }
    
    .section { max-width: 1200px; margin: 0 auto; padding: 80px 24px; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-label { font-size: 13px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
    .section-title { font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1.4; }
    .section-title em { font-style: normal; color: #6366f1; }
    
    .regions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .region-card { display: flex; align-items: center; gap: 14px; background: #fff; padding: 16px 20px; border-radius: 12px; text-decoration: none; color: inherit; border: 1px solid #e2e8f0; transition: all 0.2s; }
    .region-card:hover { border-color: #6366f1; box-shadow: 0 4px 16px rgba(99,102,241,0.12); transform: translateY(-2px); }
    .region-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #eef2ff, #e0e7ff); color: #6366f1; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; flex-shrink: 0; }
    .region-info h3 { font-size: 16px; font-weight: 700; color: #0f172a; }
    .region-info p { font-size: 12px; color: #94a3b8; }
    .arrow { margin-left: auto; color: #cbd5e1; font-size: 18px; }
    .region-card:hover .arrow { color: #6366f1; }
    
    .subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .subject-card { background: #fff; border-radius: 16px; padding: 28px 24px; text-decoration: none; color: inherit; border: 1px solid #e2e8f0; transition: all 0.2s; text-align: center; }
    .subject-card:hover { border-color: var(--accent); box-shadow: 0 8px 24px rgba(0,0,0,0.06); transform: translateY(-4px); }
    .subject-icon { font-size: 40px; margin-bottom: 12px; display: block; }
    .subject-card h3 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .subject-card p { font-size: 14px; color: #94a3b8; }
    .subject-card:hover h3 { color: var(--accent); }
    
    
    .cta-section { background: linear-gradient(135deg, #312e81, #4f46e5); border-radius: 24px; padding: 60px 40px; text-align: center; color: #fff; margin: 0 auto; max-width: 900px; }
    .cta-section h2 { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
    .cta-section p { font-size: 16px; opacity: 0.8; margin-bottom: 28px; }
    .cta-btn { display: inline-block; background: #fff; color: #4f46e5; padding: 14px 36px; border-radius: 12px; font-size: 16px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    
    @media (max-width: 768px) {
      .stats-grid { display: none; }
      .section-title { font-size: 24px; }
      .section { padding: 60px 20px; }
      .strength-cards { grid-template-columns: repeat(2, 1fr); }
      .strength-num { font-size: 32px; }
      .strength-title, .diagnosis-title, .teacher-title, .system-title { font-size: 22px; }
      .diagnosis-grid { grid-template-columns: 1fr 1fr; }
      .teacher-cards { grid-template-columns: 1fr; }
      .system-steps { flex-direction: column; align-items: center; gap: 12px; }
      .system-arrow { transform: rotate(90deg); padding: 0; }
      .consult-inner { flex-direction: column; gap: 32px; }
      .consult-form { flex: auto; width: 100%; }
      .consult-left h2 { font-size: 24px; }
    }
  </style>
</head>
<body>
  ${navHTML('')}
  
  <section class="slider" id="slider">
    <div class="slider-track" id="sliderTrack">
      
      <div class="slide slide1">
        <div class="slide-deco deco1"></div>
        <div class="slide-deco deco2"></div>
        <div class="slide-inner" style="text-align:left;max-width:600px;margin-left:8%;">
          <div class="slide-badge">과외안하니</div>
          <h2>2026 대학 합격<br><em>지금부터 다시 시작</em></h2>
          <p>선착순 30명 무료 모의테스트 제공</p>
          <a href="/지역별" class="slide-btn">무료 상담 신청 →</a>
        </div>
        <div class="slide-stats">
          <div class="slide-stat-box"><div class="slide-stat-icon" style="background:#dbeafe;">👨‍🏫</div><div class="slide-stat-text">활동 선생님수<strong>3,000명</strong></div></div>
          <div class="slide-stat-box"><div class="slide-stat-icon" style="background:#fef3c7;">📚</div><div class="slide-stat-text">교육 노하우<strong>30년</strong></div></div>
          <div class="slide-stat-box"><div class="slide-stat-icon" style="background:#d1fae5;">👥</div><div class="slide-stat-text">누적 회원수<strong>100만</strong></div></div>
        </div>
      </div>
      
      <div class="slide slide2">
        <div class="slide-deco deco1"></div>
        <div class="slide-inner">
          <div class="slide-badge">🏆 합격을 축하합니다</div>
          <h2>서울대, 연세대, 고려대<br><em>합격생 배출</em></h2>
          <p>1등급 달성 · 목표 대학 합격 · 성적 향상의 기적</p>
          <a href="/지역별" class="slide-btn">합격 후기 보기 →</a>
        </div>
      </div>
      
      <div class="slide slide3">
        <div class="slide-deco deco1"></div>
        <div class="slide-inner">
          <div class="slide-badge">🎓 전국 ${totalLocations.toLocaleString()}개 지역</div>
          <h2>우리 아이에게 딱 맞는<br><em>과외 선생님</em>을 찾아보세요</h2>
          <p>전국 시/군/구/읍/면 초등·중등·고등 8개 과목 과외 정보</p>
          <a href="/지역별" class="slide-btn">지역별 과외 찾기 →</a>
        </div>
      </div>
      
      <div class="slide slide4">
        <div class="slide-deco deco1"></div>
        <div class="slide-deco deco2"></div>
        <div class="slide-inner">
          <div class="slide-badge">✨ 맞춤 교육</div>
          <h2>내신부터 수능까지<br><em>성적 향상</em>을 위한 맞춤 전략</h2>
          <p>1:1 맞춤 커리큘럼 · AI 학습 분석 · 체계적 관리</p>
          <a href="/과목별" class="slide-btn">과목별 보기 →</a>
        </div>
      </div>
      
    </div>
    <button class="slider-arrow slider-prev" onclick="moveSlide(-1)">‹</button>
    <button class="slider-arrow slider-next" onclick="moveSlide(1)">›</button>
    <div class="slider-dots">
      <button class="slider-dot active" onclick="goSlide(0)"></button>
      <button class="slider-dot" onclick="goSlide(1)"></button>
      <button class="slider-dot" onclick="goSlide(2)"></button>
      <button class="slider-dot" onclick="goSlide(3)"></button>
    </div>
  </section>
  
  <script>
    let currentSlide = 0;
    const totalSlides = 4;
    let slideInterval = setInterval(() => moveSlide(1), 5000);
    
    function moveSlide(dir) {
      currentSlide = (currentSlide + dir + totalSlides) % totalSlides;
      updateSlider();
      resetInterval();
    }
    function goSlide(n) {
      currentSlide = n;
      updateSlider();
      resetInterval();
    }
    function updateSlider() {
      document.getElementById('sliderTrack').style.transform = 'translateX(-' + (currentSlide * 25) + '%)';
      document.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    }
    function resetInterval() {
      clearInterval(slideInterval);
      slideInterval = setInterval(() => moveSlide(1), 5000);
    }
  </script>
  
  <!-- 회원 합격후기 섹션 -->
  <section class="review-section">
    <div class="review-inner">
      <div class="section-label-center">REAL REVIEWS</div>
      <h2 class="review-main-title">회원들의 <em>100% 리얼</em> 합격후기</h2>
      <div class="review-track-wrap">
        <div class="review-track" id="reviewTrack">
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">중2 · 과학</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">중2 과학 내신이 4등급에서 2등급으로 올랐어요. 실험 원리를 그림으로 설명해 주셔서 <b>외우지 않아도 이해가 됐어요. 서술형도 이제 자신 있어요.</b></p>
            <div class="rv-author"><div class="rv-avatar-icon">🏆</div><div class="rv-info"><b>정○○ 학생</b><span>중2 · 과학 수강 · 4등급→2등급</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">고3 · 수학 수능</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">수학 수능 1등급을 목표로 시작했어요. 담당 선생님이 수능 기출을 완벽하게 분석해 주셔고 <b>실제로 1등급을 받았습니다.</b> 정말 믿고 맡길 수 있는 서비스에요.</p>
            <div class="rv-author"><div class="rv-avatar-icon">🏆</div><div class="rv-info"><b>강○○ 학부모님</b><span>고3 · 수학 수강 · 수능 1등급 · 연세대 합격</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">초5 · 영어</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">영어 알파벳도 헷갈리던 아이인데 선생님이 파닉스부터 재미있게 가르쳐 주셨어요. <b>이제 영어 책을 스스로 읽으려고 해요.</b> 어렵지 않다는 걸 알게 됐대요!</p>
            <div class="rv-author"><div class="rv-avatar-icon">😊</div><div class="rv-info"><b>윤○○ 학부모님</b><span>초5 자녀 · 영어 수강</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">고2 · 국어</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">비문학 지문이 너무 어려웠는데, 선생님이 구조 분석하는 법을 알려주셔서 <b>독해 속도가 2배로 빨라졌어요.</b> 모의고사 성적도 확 올랐습니다.</p>
            <div class="rv-author"><div class="rv-avatar-icon">📚</div><div class="rv-info"><b>이○○ 학생</b><span>고2 · 국어 수강 · 3등급→1등급</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">중1 · 수학</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">수학을 정말 싫어했는데, 선생님이 개념부터 차근차근 설명해 주셔서 <b>처음으로 수학이 재미있다고 했어요.</b> 시험 점수도 30점이나 올랐습니다!</p>
            <div class="rv-author"><div class="rv-avatar-icon">🎯</div><div class="rv-info"><b>박○○ 학부모님</b><span>중1 자녀 · 수학 수강 · 60점→90점</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">고3 · 논술</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">논술 준비를 혼자 하다가 한계를 느꼈는데, 선생님의 첨삭이 정말 꼼꼼했어요. <b>3개월 만에 논술 전형으로 경희대 합격했습니다!</b></p>
            <div class="rv-author"><div class="rv-avatar-icon">🏆</div><div class="rv-info"><b>최○○ 학생</b><span>고3 · 논술 수강 · 경희대 합격</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">중3 · 코딩</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">코딩에 관심은 있었는데 어디서 시작해야 할지 몰랐어요. 선생님이 파이썬 기초부터 프로젝트까지 <b>직접 게임을 만들면서 배우니까 너무 재밌었어요!</b></p>
            <div class="rv-author"><div class="rv-avatar-icon">💻</div><div class="rv-info"><b>김○○ 학생</b><span>중3 · 코딩 수강 · 정보올림피아드 입상</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">고1 · 영어</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">영어 듣기가 항상 발목을 잡았는데, 선생님이 매일 10분 듣기 훈련법을 알려주셨어요. <b>두 달 만에 듣기 만점 받았습니다!</b> 꾸준함의 힘을 느꼈어요.</p>
            <div class="rv-author"><div class="rv-avatar-icon">🎧</div><div class="rv-info"><b>한○○ 학생</b><span>고1 · 영어 수강 · 듣기 만점 달성</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">중2 · 수학</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">아이가 수학 문제만 보면 울던 때가 있었어요. 선생님이 정말 인내심 있게 기초부터 잡아주셨고, <b>지금은 수학이 제일 좋은 과목이 됐어요.</b> 감사합니다.</p>
            <div class="rv-author"><div class="rv-avatar-icon">💪</div><div class="rv-info"><b>조○○ 학부모님</b><span>중2 자녀 · 수학 수강 · 40점→88점</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">고3 · 사회</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">사회탐구 선택과목 때문에 고민이 많았는데, 선생님이 생활과윤리 핵심 정리를 해주셨어요. <b>수능에서 1등급 받고 서울대 합격했습니다!</b></p>
            <div class="rv-author"><div class="rv-avatar-icon">🏆</div><div class="rv-info"><b>서○○ 학생</b><span>고3 · 사회 수강 · 서울대 합격</span></div></div>
          </div>
          <div class="rv-card">
            <div class="rv-top"><span class="rv-tag">초6 · 국어</span><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">독서를 싫어하던 아이가 선생님과 독서토론 수업을 하면서 <b>스스로 책을 찾아 읽기 시작했어요.</b> 글쓰기 실력도 놀랍게 좋아졌습니다. 정말 추천해요!</p>
            <div class="rv-author"><div class="rv-avatar-icon">📖</div><div class="rv-info"><b>송○○ 학부모님</b><span>초6 자녀 · 국어 수강</span></div></div>
          </div>
        </div>
      </div>
      <div class="rv-nav">
        <button class="rv-arrow" onclick="scrollReviews(-1)">‹</button>
        <div class="rv-dots" id="rvDots">
          <span class="rv-dot active"></span><span class="rv-dot"></span><span class="rv-dot"></span><span class="rv-dot"></span><span class="rv-dot"></span><span class="rv-dot"></span><span class="rv-dot"></span><span class="rv-dot"></span><span class="rv-dot"></span><span class="rv-dot"></span><span class="rv-dot"></span>
        </div>
        <button class="rv-arrow" onclick="scrollReviews(1)">›</button>
      </div>
    </div>
  </section>
  <script>
    var rvPos = 0;
    var rvTotal = 11;
    function scrollReviews(dir) {
      var track = document.getElementById('reviewTrack');
      rvPos = Math.max(0, Math.min(rvTotal - 1, rvPos + dir));
      track.scrollTo({ left: rvPos * 360, behavior: 'smooth' });
      updateDots();
    }
    function updateDots() {
      var dots = document.querySelectorAll('.rv-dot');
      dots.forEach(function(d, i) {
        if (i === rvPos) { d.classList.add('active'); } else { d.classList.remove('active'); }
      });
    }
    document.getElementById('reviewTrack').addEventListener('scroll', function() {
      var pos = Math.round(this.scrollLeft / 360);
      if (pos !== rvPos) { rvPos = pos; updateDots(); }
    });
  </script>

  <!-- 검증된 교육회사 섹션 -->
  <section class="strength-section">
    <div class="strength-inner">
      <div class="section-label-center">OUR STRENGTH</div>
      <h2 class="strength-title">자녀 교육, '<em>검증된 교육회사</em>'에 맡기고 계신가요?</h2>
      <p class="strength-subtitle">입시제도가 불안정한 지금, 급변하는 교육 정보를 정확히 분석하고<br>아이 성향에 맞게 교육할 수 있는 전문 회사만이 자녀의 미래를 끝까지 책임집니다.</p>
      <div class="strength-cards">
        <div class="strength-card">
          <div class="strength-icon">🏆</div>
          <div class="strength-sub">오랜 시간 쌓아온 노하우</div>
          <div class="strength-num">31<span class="strength-unit">년</span></div>
          <div class="strength-desc">오랜 시간 쌓아온 노하우로<br>신뢰할 수 있는 회사</div>
        </div>
        <div class="strength-card">
          <div class="strength-icon">💻</div>
          <div class="strength-sub">최적의 수업 방식</div>
          <div class="strength-num" style="font-size:28px;">Best</div>
          <div class="strength-desc">방문 수업, 화상 수업<br>모두 가능한 유연한 시스템</div>
        </div>
        <div class="strength-card">
          <div class="strength-icon">👥</div>
          <div class="strength-sub">진행 회원 월평균 3만명</div>
          <div class="strength-num">100<span class="strength-unit">만</span></div>
          <div class="strength-desc">진행 회원 월평균 3만명,<br>누적 회원 100만명 돌파</div>
        </div>
        <div class="strength-card">
          <div class="strength-icon">📈</div>
          <div class="strength-sub">검증된 만족도</div>
          <div class="strength-num">96.7<span class="strength-unit">%</span></div>
          <div class="strength-desc">96.7%가 만족하는<br>남다른 수업 퀄리티</div>
        </div>
      </div>
    </div>
  </section>

  <!-- 퍼스널 진단검사 섹션 -->
  <section class="diagnosis-section">
    <div class="diagnosis-inner">
      <div class="section-label-center">PERSONAL DIAGNOSIS</div>
      <h2 class="diagnosis-title">아이의 <em>성향과 학습 상태,</em><br>과학적으로 검증되고 있나요?</h2>
      <p class="diagnosis-subtitle">표면적인 성적이나 태도만으로는 아이의 진짜 학습 문제를 파악할 수 없습니다.</p>
      <div class="diagnosis-grid">
        <div class="diagnosis-card"><div class="diag-num">1</div><h4>학습진단검사</h4><p>학습성격유형 및 학습동기/요인 분석</p></div>
        <div class="diagnosis-card"><div class="diag-num">2</div><h4>자기주도검사</h4><p>자기주도성 및 계획수립/실천능력 평가</p></div>
        <div class="diagnosis-card"><div class="diag-num">3</div><h4>진로적성검사</h4><p>직업성격유형 및 진로준비수준 진단</p></div>
        <div class="diagnosis-card"><div class="diag-num">4</div><h4>학습유형검사</h4><p>학습성향 및 의지, 학습행동 분석</p></div>
        <div class="diagnosis-card"><div class="diag-num">5</div><h4>입시예측검사</h4><p>목표 고교/대학합격 및 수시/정시 진단</p></div>
        <div class="diagnosis-card"><div class="diag-num">6</div><h4>부모코칭검사</h4><p>자녀 양육 스타일/행동 분석</p></div>
      </div>
    </div>
  </section>

  <!-- 선생님 역량 섹션 -->
  <section class="teacher-section">
    <div class="teacher-inner">
      <div class="section-label-center">PROFESSIONAL TEACHER</div>
      <h2 class="teacher-title">선생님의 <em>자질과 역량,</em> 충분히 확인하셨나요?</h2>
      <p class="teacher-subtitle">수업을 누가 하느냐는 아이의 인생을 결정합니다.<br>성적을 넘어, 아이의 인성까지 키우는 선생님이 절대적으로 필요합니다.</p>
      <div class="teacher-cards">
        <div class="teacher-card">
          <div class="teacher-card-num">01</div>
          <h4>전문 자격 보유 선생님</h4>
          <p>청소년 학습코칭 전문 자격을 취득한 전문 선생님만이 수업을 진행합니다</p>
        </div>
        <div class="teacher-card">
          <div class="teacher-card-num">02</div>
          <h4>검증된 선생님</h4>
          <p>최상위 대학 출신부터 진로·입시 전문가까지 검증된 인재를 선발해 2만명 이상의 선생님 풀을 구축했습니다</p>
        </div>
        <div class="teacher-card">
          <div class="teacher-card-num">03</div>
          <h4>아이 맞춤 선생님</h4>
          <p>학습 뿐 아니라, 정서적 유대와 인성 코칭으로 아이 마음을 이해하는 선생님이 함께합니다</p>
        </div>
      </div>
    </div>
  </section>

  <!-- AI 학습시스템 섹션 -->
  <section class="system-section">
    <div class="system-inner">
      <div class="section-label-center">LEARNING SYSTEM</div>
      <h2 class="system-title"><em>학습의 빈틈</em> 제대로 채워지고 있나요?</h2>
      <p class="system-subtitle">놓치고 있는 공부, 반복만으로는 채워지지 않습니다.<br>데이터 기반 분석과 맞춤 훈련이 필요합니다.</p>
      <h3 class="system-sub-heading">AI와 전문 코칭이 결합된 1:1 학습 시스템</h3>
      <div class="system-steps">
        <div class="system-step">
          <div class="step-badge">STEP 1</div>
          <h4>전문 선생님의 수업 진행</h4>
          <p>학습 상황에 맞춘 전략적 학습 플랜 설계, 개별 맞춤형 수업 진행</p>
        </div>
        <div class="system-arrow">→</div>
        <div class="system-step">
          <div class="step-badge">STEP 2</div>
          <h4>AI 문제풀이 훈련 &amp; 오답 분석</h4>
          <p>학습 데이터를 분석하여 오답 유형을 진단하고 맞춤형 문제를 무제한 제공</p>
        </div>
        <div class="system-arrow">→</div>
        <div class="system-step">
          <div class="step-badge">STEP 3</div>
          <h4>개별 맞춤 약점 보완</h4>
          <p>선생님이 AI 분석 데이터를 기반으로 정밀 보완 수업 진행</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 무료 상담 신청 폼 섹션 -->
  <section class="consult-section">
    <div class="consult-inner">
      <div class="consult-left">
        <h2>지금 바로<br><em>무료 상담</em>을 신청하세요</h2>
        <p>전국 ${totalLocations.toLocaleString()}개 지역,<br>${totalPages.toLocaleString()}개 맞춤 과외 정보가 준비되어 있습니다.</p>
        <div class="consult-features">
          <div class="consult-feat">✅ 무료 학습 진단 테스트</div>
          <div class="consult-feat">✅ 1:1 맞춤 커리큘럼 설계</div>
          <div class="consult-feat">✅ 전문 선생님 매칭</div>
        </div>
      </div>
      <div class="consult-form">
        <h3>빠른 무료 상담 신청</h3>
        <input type="text" class="form-input" placeholder="학부모 성함">
        <select class="form-input"><option>자녀 학년 선택</option><option>초등학교</option><option>중학교</option><option>고등학교</option></select>
        <select class="form-input"><option>상담 영역 선택</option><option>교과관리</option><option>학습습관</option><option>진로입시</option><option>검정고시</option><option>코딩</option></select>
        <input type="tel" class="form-input" placeholder="연락처 (010-0000-0000)">
        <button class="form-submit">무료 상담 신청하기</button>
        <p class="form-note">* 상담 신청 후 24시간 이내 연락드립니다</p>
      </div>
    </div>
  </section>

  <!-- 지역별 과외 섹션 -->
  <section class="section">
    <div class="section-header">
      <div class="section-label">지역별 과외</div>
      <h2 class="section-title">우리 동네 <em>과외 정보</em> 바로 확인</h2>
    </div>
    <div class="regions-grid">${regionCards}</div>
  </section>

  <!-- 과목별 섹션 -->
  <section class="section" style="padding-top:0">
    <div class="section-header">
      <div class="section-label">과목별</div>
      <h2 class="section-title">과목에 맞는 <em>맞춤 과외</em>를 선택하세요</h2>
    </div>
    <div class="subjects-grid">${subjectCards}</div>
  </section>

  <!-- 우측 플로팅 버튼 -->
  <div class="floating-btns">
    <a href="tel:010-0000-0000" class="float-btn float-call">📞 전화상담</a>
    <a href="#" class="float-btn float-kakao">💬 카카오톡 상담</a>
    <a href="/상담" class="float-btn float-free">⭐ 무료체험 신청</a>
  </div>

  ${footerHTML()}
</body>
</html>`;
}

// --- 카테고리: 지역별 ---
function renderRegionList() {
  const allRegions = Object.keys(REGIONS);
  
  // 각 구별 대표 동네 데이터
  const subAreas = {
    "강남구":"역삼·개포·청담","강동구":"명일·고덕·상일","강북구":"미아·번·수유","강서구":"염창·등촌·화곡","관악구":"봉천·신림·남현",
    "광진구":"중곡·능·구의","구로구":"신도림·구로·가리봉","금천구":"가산·독산·시흥","노원구":"월계·공릉·하계","도봉구":"쌍문·방학·창",
    "동대문구":"신설·용두·제기","동작구":"노량진·상도·본","마포구":"아현·공덕·신공덕","서대문구":"합·미근·냉천","서초구":"방배·양재·우면",
    "성동구":"상왕십리·하왕십리·홍익","성북구":"성북·돈암·소문","송파구":"잠실·신천·풍납","양천구":"신정·목·신월","영등포구":"영등포·여의도·당산",
    "용산구":"후암·갈월·남영","은평구":"수색·녹번·불광","종로구":"청운·신교·궁정","중구":"소공·명동·회현","중랑구":"면목·상봉·중화",
  };

  // 지역별 카드 데이터 생성 (JSON)
  const regionData = {};
  for (const [parent, districts] of Object.entries(REGIONS)) {
    regionData[parent] = districts.map(d => ({
      name: d,
      sub: subAreas[d] || ''
    }));
  }

  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('지역별 과외 안내 | 전국 맞춤 과외 - 안하니', '전국 시/군/구 과외 정보를 지역별로 확인하세요.', 'https://anhani.com/지역별')}
  <style>${commonStyles()}
    .rg-wrap { max-width: 1000px; margin: 0 auto; padding: 48px 24px 80px; }
    .rg-label { display: inline-block; background: #312e81; color: #fff; font-size: 13px; font-weight: 700; padding: 4px 14px; border-radius: 20px; margin-bottom: 16px; }
    .rg-title { font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 10px; line-height: 1.3; }
    .rg-title em { font-style: normal; color: #312e81; }
    .rg-subtitle { font-size: 15px; color: #64748b; margin-bottom: 36px; }
    
    .rg-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px; }
    .rg-tab { padding: 10px 22px; border-radius: 24px; border: 1.5px solid #d1d5db; background: #fff; font-size: 15px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
    .rg-tab:hover { border-color: #312e81; color: #312e81; }
    .rg-tab.active { background: #312e81; color: #fff; border-color: #312e81; }
    
    .rg-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .rg-card { background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 12px; padding: 20px 16px; text-align: center; text-decoration: none; color: inherit; transition: all 0.2s; }
    .rg-card:hover { border-color: #312e81; box-shadow: 0 4px 16px rgba(49,46,129,0.12); transform: translateY(-3px); }
    .rg-card-name { font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .rg-card-sub { font-size: 12px; color: #94a3b8; }
    
    @media (max-width: 640px) {
      .rg-title { font-size: 24px; }
      .rg-tab { padding: 8px 16px; font-size: 13px; }
      .rg-cards { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
      .rg-card { padding: 14px 10px; }
      .rg-card-name { font-size: 15px; }
    }
  </style></head><body>
  ${navHTML('region')}
  
  <div class="rg-wrap">
    <div class="rg-label">지역 선택</div>
    <h1 class="rg-title">전국 <em>지역별 과외</em> 안내</h1>
    <p class="rg-subtitle">지역 버튼을 클릭하면 해당 지역 시·구가 나타납니다.</p>
    
    <div class="rg-tabs" id="rgTabs">
      ${allRegions.map((r, i) => `<div class="rg-tab${i === 0 ? ' active' : ''}" onclick="showRegion('${r}', this)">${r}</div>`).join('')}
    </div>
    
    <div class="rg-cards" id="rgCards"></div>
  </div>
  
  <script>
    var regionData = ${JSON.stringify(regionData)};
    
    function showRegion(name, el) {
      document.querySelectorAll('.rg-tab').forEach(function(t) { t.classList.remove('active'); });
      if (el) el.classList.add('active');
      
      var cards = document.getElementById('rgCards');
      var data = regionData[name] || [];
      cards.innerHTML = data.map(function(d) {
        var url = '/' + encodeURIComponent(d.name + '-초등-수학-과외');
        return '<a href="' + url + '" class="rg-card">' +
          '<div class="rg-card-name">' + d.name + '</div>' +
          '</a>';
      }).join('');
    }
    
    showRegion('${allRegions[0]}', null);
  </script>
  
  ${footerHTML()}
  </body></html>`;
}

// --- 카테고리: 특정 지역 ---
function renderRegionDetail(region) {
  const districts = REGIONS[region];
  if (!districts) return null;
  
  const cards = districts.map(d => {
    const links = SUBJECTS.map(s => 
      `<a href="/${encodeURIComponent(`${d}-초등-${s}-과외`)}" class="subj-link">${s}</a>`
    ).join('');
    return `<div class="cat-card"><h3>${d}</h3>
      <div class="level-tabs">
        ${LEVELS.map(l => `<span class="level-tab" onclick="this.parentElement.parentElement.querySelectorAll('.subj-link').forEach(a=>{const h=a.href;a.href=h.replace(/초등|중등|고등/,'${l}')})">${l}</span>`).join('')}
      </div>
      <div class="chips">${links}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('${region} 과외 - 안하니', '${region} 지역 초등·중등·고등 과외 정보를 확인하세요.', 'https://anhani.com/지역별/${encodeURIComponent(region)}')}
  <style>${commonStyles()}
    .page-hero { background: linear-gradient(135deg, #312e81, #4f46e5); color: #fff; padding: 48px 24px; text-align: center; }
    .page-hero h1 { font-size: 32px; font-weight: 800; }
    .page-hero p { opacity: 0.8; margin-top: 8px; }
    .breadcrumb { max-width: 1200px; margin: 0 auto; padding: 16px 24px; font-size: 14px; color: #94a3b8; }
    .breadcrumb a { color: #6366f1; text-decoration: none; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px 24px 60px; }
    .cat-card { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
    .cat-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .subj-link { padding: 6px 14px; background: #f1f5f9; border-radius: 8px; color: #475569; text-decoration: none; font-size: 14px; transition: all 0.2s; }
    .subj-link:hover { background: #eef2ff; color: #6366f1; }
    .level-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
    .level-tab { padding: 4px 12px; background: #e2e8f0; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .level-tab:hover { background: #6366f1; color: #fff; }
  </style></head><body>
  ${navHTML('region')}
  <div class="page-hero"><h1>${region} 과외</h1><p>${region} 지역 ${districts.length}개 시/군/구 과외 정보</p></div>
  <div class="breadcrumb"><a href="/">홈</a> &gt; <a href="/지역별">지역별</a> &gt; ${region}</div>
  <div class="container">${cards}</div>
  ${footerHTML()}
  </body></html>`;
}

// --- 카테고리: 과목별 ---
function renderSubjectList() {
  const subjectColors = {
    "국어": "#ef4444", "영어": "#3b82f6", "수학": "#22c55e", "사회": "#f59e0b",
    "과학": "#a855f7", "코딩": "#06b6d4", "검정고시": "#f97316", "논술": "#64748b"
  };
  const subjectIcons = {
    "국어": "📖", "영어": "🌍", "수학": "📐", "사회": "🏛️",
    "과학": "🔬", "코딩": "💻", "검정고시": "📝", "논술": "✍️"
  };
  
  const cards = SUBJECTS.map(s => {
    const regionLinks = Object.keys(REGIONS).map(r => 
      `<a href="/지역별/${encodeURIComponent(r)}" class="region-chip">${r}</a>`
    ).join('');
    return `<div class="subj-card" style="--accent:${subjectColors[s]}">
      <div class="subj-header"><span class="subj-icon">${subjectIcons[s]}</span><h3>${s} 과외</h3></div>
      <p>${SUBJECT_CONTENT[s].why[0].substring(0, 80)}...</p>
      <div class="chips">${regionLinks}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('과목별 과외 - 안하니', '국어, 영어, 수학, 사회, 과학, 코딩, 검정고시, 논술 과외 정보를 확인하세요.', 'https://anhani.com/과목별')}
  <style>${commonStyles()}
    .page-hero { background: linear-gradient(135deg, #312e81, #4f46e5); color: #fff; padding: 48px 24px; text-align: center; }
    .page-hero h1 { font-size: 32px; font-weight: 800; }
    .page-hero p { opacity: 0.8; margin-top: 8px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
    .subj-card { background: #fff; border-radius: 16px; padding: 28px; margin-bottom: 20px; border: 1px solid #e2e8f0; border-top: 4px solid var(--accent); }
    .subj-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .subj-icon { font-size: 32px; }
    .subj-card h3 { font-size: 22px; font-weight: 700; }
    .subj-card > p { color: #64748b; font-size: 14px; margin-bottom: 16px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .region-chip { padding: 6px 14px; background: #f1f5f9; border-radius: 8px; color: #475569; text-decoration: none; font-size: 13px; transition: all 0.2s; }
    .region-chip:hover { background: #eef2ff; color: #6366f1; }
  </style></head><body>
  ${navHTML('subject')}
  <div class="page-hero"><h1>과목별 과외</h1><p>8개 전문 과목별 과외 정보</p></div>
  <div class="container">${cards}</div>
  ${footerHTML()}
  </body></html>`;
}

// --- 카테고리: 학교급별 ---
function renderLevelList() {
  const levelData = {
    "초등": { emoji: "🌱", desc: "학습 습관 형성과 기초 실력을 탄탄하게 다지는 시기입니다. 재미있게 배우면서 자신감을 키워주세요." },
    "중등": { emoji: "📚", desc: "내신 대비와 고등 진학을 위한 체계적 학습 전략이 필요한 시기입니다." },
    "고등": { emoji: "🎯", desc: "수능과 내신을 동시에 잡는 입시 맞춤 전략으로 목표 대학에 한 걸음 더 다가가세요." }
  };

  const cards = LEVELS.map(l => {
    const d = levelData[l];
    const subjLinks = SUBJECTS.map(s => 
      `<a href="/학교급별/${encodeURIComponent(l)}/${encodeURIComponent(s)}" class="subj-link">${s}</a>`
    ).join('');
    return `<div class="level-card-lg">
      <span class="lv-emoji">${d.emoji}</span>
      <h3>${l} 과외</h3>
      <p>${d.desc}</p>
      <div class="chips">${subjLinks}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('학교급별 과외 - 안하니', '초등, 중등, 고등 학교급에 맞는 과외 정보를 확인하세요.', 'https://anhani.com/학교급별')}
  <style>${commonStyles()}
    .page-hero { background: linear-gradient(135deg, #312e81, #4f46e5); color: #fff; padding: 48px 24px; text-align: center; }
    .page-hero h1 { font-size: 32px; font-weight: 800; }
    .page-hero p { opacity: 0.8; margin-top: 8px; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 24px; }
    .level-card-lg { background: #fff; border-radius: 16px; padding: 36px; margin-bottom: 20px; border: 1px solid #e2e8f0; text-align: center; }
    .lv-emoji { font-size: 48px; display: block; margin-bottom: 12px; }
    .level-card-lg h3 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .level-card-lg > p { color: #64748b; font-size: 15px; margin-bottom: 20px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .subj-link { padding: 8px 18px; background: #f1f5f9; border-radius: 8px; color: #475569; text-decoration: none; font-size: 14px; transition: all 0.2s; }
    .subj-link:hover { background: #eef2ff; color: #6366f1; }
  </style></head><body>
  ${navHTML('level')}
  <div class="page-hero"><h1>학교급별 과외</h1><p>초등·중등·고등 맞춤 과외 정보</p></div>
  <div class="container">${cards}</div>
  ${footerHTML()}
  </body></html>`;
}

// --- RSS 피드 ---
function generateRSS() {
  const items = [];
  const regions = ["서울","경기","부산","대구","인천","광주","대전","울산"];
  const subjects = ["수학","영어","국어","과학","코딩"];
  const levels = ["초등","중등","고등"];
  
  for (const region of regions) {
    const districts = REGIONS[region] || [];
    for (const d of districts.slice(0, 3)) {
      for (const subj of subjects.slice(0, 2)) {
        const lvl = levels[Math.floor(Math.random() * levels.length)];
        const title = `${d} ${lvl} ${subj} 과외 추천 - 비용, 선생님 선택 가이드`;
        const link = `https://anhani.com/${encodeURIComponent(d + '-' + lvl + '-' + subj + '-과외')}`;
        const desc = `${region} ${d} 지역 ${lvl}학생 ${subj} 과외 정보를 찾고 계신가요? 과외비, 좋은 선생님 고르는 법, 실제 후기까지 한 번에 정리했습니다.`;
        items.push(`    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${desc}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>`);
      }
    }
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>과외안하니 - 전국 과외 정보</title>
    <link>https://anhani.com</link>
    <description>전국 시/군/구/읍/면 초등·중등·고등 과외 정보를 한 곳에서 확인하세요.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>`;
}

// --- robots.txt ---
function robotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: https://anhani.com/sitemap.xml
RSS: https://anhani.com/rss.xml`;
}


// --- 학원 데이터 ---
const CENTERS = [{"n":"하남풍산점","r":"경기","a":"경기 하남시 덕풍동로 119","l":"경기도 하남시 덕풍동로119 하남프라자501호   스타벅스 맞은편 건물입니다  주차 1시간 가능합니다","s":["영어","수학"],"e":"나룰초, 하남풍산초","m":"덕풍중, 신평중, 동부중","h":"풍산고, 남한고, 신장고, 감일고, 미사고, 애니고"},{"n":"사동점","r":"경북","a":"경북 경산시 백자로10길 1","l":"경산시 백자로 10길 1 402호(사동 공차건물)","s":["국어","영어","수학","과학","사회"],"e":"사동초, 삼성현초, 평산초, 동부초","m":"사동중, 문명중, 삼성현중, 경산중, 경산여중, 장산중","h":"사동고, 경산여고, 경산고, 문명고, 경북체고"},{"n":"하계점","r":"서울","a":"서울 노원구 노원로 257","l":"혜성여고 건너편, 하계중 바로 옆, 1층에 메가커피가 있는 건물의 4층 맨 안쪽","s":["국어","영어","수학","과학","사회"],"e":"","m":"하계중, 녹천중, 상명중, 태릉중, 공릉중","h":"혜성여고, 대진고, 상명고, 월계고"},{"n":"수지점","r":"경기","a":"경기 용인시 수지구 문정로 13","l":"수지구청 맞으면 우리은행 건물 / 수지구청역 2번출구에서 2분거리","s":["국어","영어","수학","과학","사회"],"e":"풍천초, 정평초, 이현초","m":"이현중, 수지중, 정평중","h":"상현고, 신봉고, 홍천고, 성복고, 풍덕고, 수지고, 죽전고"},{"n":"이곡점","r":"대구","a":"대구광역시 달서구 이곡동 달구벌대로259길 33","l":"대구시 달서구 달구벌대로259길 33 제일빌딩 5층 (1층이 현풍닭칼국수 음식점이 있는 빌딩)","s":["국어","영어","수학","과학","사회"],"e":"와룡초","m":"성산중","h":"성서고"},{"n":"탄현점","r":"경기","a":"경기 고양시 일산서구 산현로17번길 23","l":"✅주차장 주소: 경기도 고양시 일산서구 산현로17번길 35 탄현제2공영주차장 (간판은 아파트쪽에서 보이기 때문에 혹시 간판이 보이지 않으면 농협","s":["영어","수학","과학"],"e":"상탄초","m":"일산동중, 일산중, 호곡중","h":"일산동고, 덕이고, 중산고, 일산동고, 중산고"},{"n":"철산점","r":"경기","a":"경기도 광명시 철산동 도덕공원로 27","l":"경기도 광명시 도덕공원로27 삼우빌딩 2층 (주차장이 없습니다 인근 철산성당이나 인근 아파트에 주차가능합니다)","s":["국어","영어","수학","과학"],"e":"","m":"","h":""},{"n":"치평점","r":"광주","a":"광주 서구 치평로 76","l":"상무지구 이디야커피 건물4층이나 맥도널드 옆에 있다고 전달드립니다.","s":["국어","영어","수학"],"e":"운천초, 계수초","m":"전남중, 동명중","h":"전남고, 상무고, 광주여고, 상일여고"},{"n":"지족점","r":"대전","a":"대전 유성구 지족동","l":"노은역 동광장 다이소 맞은편 와플대학, BYC건물 4층","s":["국어","영어","수학","과학","사회"],"e":"상지초, 지족초, 노은초, 수정초","m":"지족중, 노은중","h":"반석고, 지족고, 노은고, 유성여고"},{"n":"수완점","r":"광주","a":"광주 광산구 임방울대로 310","l":"텃밭 건물로 들어와서 4층으로 올라오시면 바로 아발론 어학원이 있습니다. 그대로 오른쪽을 바라보시면 복도 안쪽에 수완센터가 자리하고 있습니다.","s":["국어","영어","수학"],"e":"","m":"수완중, 장덕중","h":"수완고, 장덕고"},{"n":"호매실점","r":"경기","a":"경기 수원시 권선구 금곡로 116","l":"금곡동 유동타워 6층입니다.(채선당,아이온 소아과건물)","s":["국어","영어","수학","과학","사회"],"e":"","m":"","h":"호매실고, 영신여고, 동원고, 동우여고"},{"n":"신곡점","r":"경기","a":"경기도 의정부시 신곡동 장곡로 626","l":"경기북부청사경전철역 건너편 금오종합상가 3층(1층 페리카나)","s":["국어","영어","수학","과학"],"e":"","m":"천보중, 효자중","h":"효자고, 경민it고"},{"n":"행신점","r":"경기","a":"경기 고양시 덕양구 중앙로 442","l":"경기도 고양시 중앙로 442, 아성프라자 305호(홈플러스 건물 3층)","s":["국어","영어","수학","과학","사회"],"e":"아람초, 행신초, 덕은초, 서정초","m":"서정중, 행신중, 무원중, 가람중, 덕양중","h":"서정고, 행신고, 무원고"},{"n":"서신점","r":"전북","a":"전북특별자치도 전주시 완산구 서신로 5","l":"서신로5 4층(본병원 사거리에 있습니다)","s":["영어","수학","과학"],"e":"중산초","m":"","h":"한일고, 근영고"},{"n":"센트럴점","r":"경기","a":"경기 하남시 미사강변대로 84","l":"미사탑프라자 6층( 빽다방 건물/ 자이아파트 정문)","s":["국어","영어","수학"],"e":"한홀초, 청하초","m":"윤슬중, 미사중","h":"미사강변고, 미사고, 신장고, 남한고, 풍산고, 강일고, 특성화고"},{"n":"미금점","r":"경기","a":"경기도 성남시 분당구 금곡동 돌마로 87","l":"미금역 2번출구 150m 앞 국민은행 건물4층","s":["영어","수학"],"e":"미금초, 청솔초, 늘푸른초","m":"불곡중, 청솔중, 늘푸른중","h":"불곡고, 늘푸른고, 분당중앙고"},{"n":"야탑점","r":"경기","a":"경기 성남시 중원구 양현로 461","l":"","s":["국어","영어","수학","과학"],"e":"여수초, 야탑초, 중탑초","m":"야탑중","h":"아람고"},{"n":"갈매점","r":"경기","a":"경기 구리시 갈매중앙로 79","l":"안녕하세요, OO학생 학부모님~갈매점. 위치는 (구리시 갈매동79, 에스엠타워602호)입니다. 1층에 새마을금고, 베스킨라빈스 건물 6층입니다.","s":["국어","영어","수학","과학","사회"],"e":"갈매초, 산마루초","m":"갈매중","h":"갈매고"},{"n":"마두점","r":"경기","a":"경기 고양시 일산동구 중앙로 1191","l":"스타벅스 마두역점 건물 6층","s":["국어","영어","수학","과학","사회"],"e":"백신초, 호수초","m":"백석중, 저동중","h":"백신고, 정발고"},{"n":"첨단점","r":"광주","a":"광주 광산구 월계로 191","l":"광주광역시 광산구 월계로191 첨단메디컬빌딩 4층 404호 1층에 김가네와 쿼드커피 사이에 입구가 있습니다 엘리베이터에서 내리셔서 바로 오른쪽에","s":["국어","영어","수학"],"e":"월봉초","m":"천곡중, 월봉중","h":"장덕고"},{"n":"송정점","r":"울산","a":"울산 북구 화산로 123","l":"울산 북구 화산로 123 골드테라스건물 4층 404호 1층에 백소정건물있습니다.","s":["국어","영어","수학","과학","사회"],"e":"고헌초, 송정초, 화봉초","m":"고헌중, 화봉중, 연암중","h":"화봉고, 매곡고, 무룡고, 울산공고, 에너지고"},{"n":"석동점","r":"경남","a":"경남 창원시 진해구 석동로 51","l":"진해구 석동로 51 세븐코아빌딩 5층 와와학습코칭센터","s":["영어","수학"],"e":"","m":"석동중","h":""},{"n":"수진점","r":"경기","a":"경기 성남시 중원구 원터로 95","l":"성남중앙초 후문 앞 cu 옆 건물, 행복한성적표 위층","s":["영어","수학"],"e":"성남중앙초","m":"성일중, 성남중, 동광중, 풍생중","h":"성남여고, 성남고, 성일고, 동광고, 효성고, 숭신여고, 복정고"},{"n":"수성2가점","r":"대구","a":"대구 수성구 명덕로 404","l":"_x0008_대구 수성고 명덕로 404, 404호 3호선 수성시장역 2번출구에서 대봉교방향으로, 금손아귀 건물 4층","s":["국어","영어","수학","과학","사회"],"e":"동일초, 동도초, 동성초","m":"대구동중, 신명여중, 중앙중, 황금중","h":"남산고, 경북고"},{"n":"기흥구청점","r":"경기","a":"경기 용인시 기흥구 구갈로60번길 15","l":"기흥구청 앞 신협 건물 3층, 한양수자인 103동 건너편","s":["국어","영어","수학"],"e":"구갈초, 산양초, 관곡초","m":"구갈중, 신갈중, 신릉중","h":"기흥고, 신갈고, 성지고"},{"n":"대구도남점","r":"대구","a":"대구 북구 도남중앙로7길 20-3","l":"대구 북구 도남중앙로 7길, 20-3. 402호","s":["국어","영어","수학","과학","사회"],"e":"국우초, 도남초","m":"학남중","h":"학남고"},{"n":"반석점","r":"대전","a":"대전 유성구 지족로 282","l":"와이식자재마트 대각선, 브래드홀릭 건물 3층","s":["국어","영어","수학"],"e":"새미래초, 반석초","m":"새미래중, 외삼중, 하기중","h":"반석고, 노은고, 지족고, 유성고"},{"n":"화성태안점","r":"경기","a":"경기 화성시 병점중앙로 87","l":"","s":["국어","영어","수학"],"e":"","m":"","h":""},{"n":"봉담점","r":"경기","a":"경기 화성시 봉담읍 상리중심상가길 28-8","l":"","s":["국어","영어","수학","과학","사회"],"e":"","m":"","h":""},{"n":"삼각산점","r":"서울","a":"서울 강북구 미아동","l":"","s":["국어","영어","수학","과학","사회"],"e":"길음초, 송천초, 미양초","m":"삼각산중, 길음중, 미양중","h":"삼각산고, 미양고, 영훈고, 혜화여고"},{"n":"당산점","r":"서울","a":"서울 영등포구 당산로44길 3","l":"당산역 10번 출구, 2호선 지나는 도로 따라 레미안4차 지나면 크로미빵집있는 건물 5층입니다.","s":["국어","영어","수학"],"e":"당서초, 영동초, 당중초","m":"당산중, 당산서중, 선유중","h":"선유고, 여의도고, 여의도여고, 영등포여고, 관악고"},{"n":"은평점","r":"서울","a":"서울특별시 은평구 진관동 진관2로 29-21","l":"구파발역 2번출구,구파발성당 맞은편 1층 이디야,서브웨이 건물입니다.","s":["영어","과학","사회"],"e":"은진초, 은빛초, 진관초, 신도초","m":"진관중, 신도중, 연천중","h":"진관고, 신도고, 대성고, 선일여고"},{"n":"화정점","r":"경기","a":"경기 고양시 덕양구 화신로 263","l":"경기도 고양시 덕양구 화신로 263 브릿지타워 2층 214호 (한방병원 건물)","s":["국어","영어","수학","과학"],"e":"","m":"화정중, 지도중, 신능중","h":"화정고, 화수고, 백양고"},{"n":"인창점","r":"경기","a":"경기 구리시 건원대로 36","l":"화성골드프라자( 1층에 베스킨라빈스)  4층","s":["국어","영어","수학","과학","사회"],"e":"건원초, 동구초, 구지초","m":"인창중, 동구중","h":"인창고, 수택고"},{"n":"염창점","r":"서울","a":"서울 강서구 양천로67길 15","l":"등촌역 2번출구 직진 500미터 염창중앙교회옆건물, 강서구 염창동 242-11 한히빌딩 5층","s":["국어","영어","수학","과학"],"e":"염경초, 염동초, 백석초","m":"","h":""},{"n":"인천삼산점","r":"인천","a":"인천 부평구 체육관로 32","l":"인천 부평구 체육관로 32 하이존 8층 (삼산체육관에서 도보 5분) or 굴포천역 도보 5분 or 삼산타운 7단지 정문 맞은편","s":["국어","영어","수학","과학","사회"],"e":"굴포초, 진산초, 영선초","m":"진산중, 삼산중, 구산중","h":"영선고, 삼산고"},{"n":"이매점","r":"경기","a":"경기도 성남시 분당구 이매동 이매로 49","l":"수인 분당선 이매역 6번 출구 바로 앞 1층 쿠쿠매장 주영빌딩 4층","s":["국어","영어","수학","과학","사회"],"e":"이매초, 안말초","m":"매송중, 이매중, 송림중","h":"이매고, 송림고, 태원고, 돌마고"},{"n":"침산점","r":"대구","a":"대구 북구 침산남로 140","l":"","s":["국어","영어","수학","과학","사회"],"e":"침산초, 달산초","m":"침산중, 대구일중, 경명여중, 산격중, 대구북중","h":"경명여고, 칠성고, 청구고, 사대부고, 경상고"},{"n":"오산점","r":"경기","a":"경기 오산시 성호대로 121","l":"오산시청 우리은행 건물 5층","s":["국어","영어","수학","과학","사회"],"e":"운천초, 성호초, 운산초","m":"운암중, 운천중, 성호중","h":"운암고, 운천고"},{"n":"별내점","r":"경기","a":"경기 남양주시 순화궁로 349","l":"별내 카페거리 건너편 메가커피 건물5층","s":["국어","영어","수학","과학"],"e":"샛별초, 화접초, 별가람초, 한별초, 덕송초","m":"별가람중, 한별중, 한삼중","h":"별가람고, 별내고, 한삼고, 퇴계원고, 청학고"},{"n":"영통구청점","r":"경기","a":"경기 수원시 영통구 매탄로108번길 10","l":"영통구청 옆 중심상가 내 맘스터치 건물 6층","s":["국어","영어","수학","과학","사회"],"e":"매탄초,매현초","m":"매탄중,매현중","h":"매탄고,효원고"},{"n":"부평점","r":"인천","a":"인천광역시 부평구 부평동 부흥로 264","l":"부평시장역3번출구에서 도보5분거리/쿠우쿠우 있는 건물 5층","s":["국어","영어","수학","과학","사회"],"e":"부평서초,부평동초","m":"부원중,부원여중","h":"부평고,부평여고"},{"n":"풍동점","r":"경기","a":"경기 고양시 일산동구 숲속마을로 44","l":"풍동상가 미래타워6층(빽다방,이삭토스트건물)","s":["국어","영어","수학","과학","사회"],"e":"풍산초, 다솜초, 은행초","m":"풍동중, 풍산중, 양일중","h":"풍동고, 세원고"},{"n":"송천점","r":"전북","a":"전북특별자치도 전주시 덕진구 솔내로 129","l":"","s":["국어","영어","수학","과학"],"e":"","m":"","h":""},{"n":"태평점","r":"대전","a":"대전 중구 태평로 15","l":"","s":["국어","영어","수학"],"e":"버드내초","m":"버드내중, 태평중","h":""},{"n":"목감점(모두)","r":"경기","a":"경기 시흥시 수풀안길 14-23","l":"시흥시 수풀안길 14-23 메트로타워2 4층(1층에 원할머니보쌈있습니다)","s":["국어","영어","수학","과학","사회"],"e":"조남초, 목감초","m":"조남중","h":"목감고"},{"n":"송촌점","r":"대전","a":"대전 대덕구 동춘당로94번길 11-7","l":"","s":["국어","영어","수학"],"e":"송촌초","m":"매봉중, 법동중, 송촌중","h":"송촌고, 명석고, 우송고, 대전여고, 동대전고"},{"n":"중동점","r":"경기","a":"경기 부천시 원미구 길주로 191","l":"","s":["국어","영어","수학"],"e":"부흥초, 중흥초","m":"중흥중, 부명중","h":"증흥고, 중원고, 경기예고"},{"n":"중동점(W+)","r":"경기","a":"경기 부천시 원미구 길주로 219","l":"","s":["수학","과학"],"e":"부흥초, 중흥초","m":"중흥중, 부명중","h":"증흥고, 중원고, 경기예고"},{"n":"신중동점","r":"경기","a":"경기 부천시 원미구 조마루로291번길 25","l":"","s":["국어","영어","수학"],"e":"부곡초, 계남초, 심원초","m":"심원중, 계남중, 부곡중","h":"계남고, 심원고, 원미고"},{"n":"화정점(W+)","r":"경기","a":"경기 고양시 덕양구 화중로 32-31","l":"","s":["수학","과학"],"e":"지도초","m":"화정중, 신능중","h":"화정고, 서정고, 백양고"},{"n":"양덕점","r":"경북","a":"경북 포항시 북구 천마로 66","l":"양덕 하나로마트 근처, 양덕 농협사거리 롯데리아 사이 건물,  이디야 건물 4층,","s":["국어","영어","수학","과학","사회"],"e":"양덕초 양서초 장흥초","m":"양덕중 장흥중 대도중 환호여중","h":"장성고 포고 포여고 유성여고"},{"n":"옥정점","r":"경기","a":"경기 양주시 옥정로 218","l":"","s":["수학","과학"],"e":"","m":"","h":""},{"n":"은평점(글로리드)","r":"서울","a":"서울 은평구 진관2로 29-21","l":"","s":["국어"],"e":"","m":"","h":""},{"n":"다산점(W+)","r":"경기","a":"경기 남양주시 다산순환로 350","l":"","s":["수학","과학"],"e":"","m":"","h":""},{"n":"옥길스타점","r":"경기","a":"경기 부천시 소사구 범안로 231-15","l":"","s":["국어","영어","수학"],"e":"","m":"","h":""},{"n":"광장점","r":"서울","a":"서울 광진구 광나루로 584","l":"올림픽대교북단사거리 바로 앞, 광진구 광나루로 584 동서울빌딩5층","s":["국어","영어","수학","과학"],"e":"","m":"양진중, 광장중","h":"광남고, 단대부고, 건대부고"},{"n":"반월당점","r":"대구","a":"대구 중구 대봉로 253","l":"대구 중구 대봉로 253 3층 와와학습코칭학원(센트로팰리스 대백마트 맞은편)","s":["국어","영어","수학","과학","사회"],"e":"대구초, 사대부초","m":"대구제일중, 사대부중","h":"사대부고, 경북여고"},{"n":"배곧점","r":"경기","a":"경기 시흥시 배곧4로 22","l":"","s":["국어","영어","수학","과학","사회"],"e":"","m":"","h":""},{"n":"명지대역점","r":"경기","a":"경기 용인시 처인구 명지로40번길 4","l":"","s":["영어","수학"],"e":"함박초, 서룡초","m":"용신중, 용인중","h":""},{"n":"칠금점","r":"기타","a":"충청북도 충주시 칠금동 계명대로 29","l":"","s":["국어","영어","수학","과학","사회"],"e":"탄금초, 칠금초","m":"탄금중, 칠금중, 중앙중, 미덕중, 여중, 북여중, 충주중","h":"국원고, 예성여고, 충주여고"},{"n":"세교점","r":"경기","a":"경기 오산시 수청로 193","l":"오산세교종합사회복지관 앞 스타벅스 건물 4층","s":["국어","영어","수학","과학","사회"],"e":"","m":"문시중, 세마중","h":"세교고"},{"n":"수지점(글로리드)","r":"경기","a":"경기 용인시 수지구 풍덕천로 114","l":"수지구청역 2번출구 바로 앞에 미스터피자 건물 3층","s":["국어","영어","수학","과학","사회"],"e":"풍천초, 정평초, 이현초","m":"이현중, 수지중, 정평중","h":"상현고, 신봉고, 홍천고, 성복고, 풍덕고, 수지고, 죽전고"},{"n":"마포2호점","r":"서울","a":"서울 마포구 토정로 252","l":"서울특별시 마포구 토정로 252 승지빌딩 3층 와와학습코칭학원 (대흥역 3번출구 5분거리이며 1층 기아자동차 AS센터 건물입니다.)","s":["국어","영어","수학","사회"],"e":"신석초, 염리초, 용강초, 서강초, 우이초","m":"서울여중, 동도중, 신수중","h":"서울여고, 숭문고, 광성고, 한성고, 배문고"},{"n":"다산도농점","r":"경기","a":"경기 남양주시 도농로 29","l":"다산도농 이마트앞 부영프라자 604호","s":["국어","영어","수학","과학","사회"],"e":"도농초, 금교초, 미금초,","m":"동화중, 도농중, 가운중","h":"도농고, 가운고, 다산고"},{"n":"별가람점","r":"경기","a":"경기 남양주시 덕송1로55번길 20","l":"경기도 남양주시 별내동 824-2 별내프라자-2 503호                                                 ","s":["국어","영어","수학","과학","사회"],"e":"덕송초, 샛별초","m":"별가람중, 화접중, 한별중","h":"별내고, 별가람고"},{"n":"동탄목동점","r":"경기","a":"경기 화성시 동탄신리천로 408","l":"경기도 화성시 신리천로 408 M메디컬프라자 212호 와와학습코칭학원","s":["국어","영어","수학","과학","사회"],"e":"동탄목동초, 한율초","m":"동탄목동중, 세정중","h":"창의고, 정현고"},{"n":"두호점","r":"기타","a":"경상북도 포항시 북구 용두산길 32","l":"파리 바게트 맞은편 건물 3층","s":["국어","영어","수학","과학","사회"],"e":"","m":"환호여중, 대도중","h":"두호고, 포여고, 장성고, 포고, 중앙고, 중앙여고, 대동고"},{"n":"선운점","r":"광주","a":"광주 광산구 선운로20번길 55-1","l":"선운로 20번길 55-1 4층 (배가마트 옆 우산신협 건물)","s":["영어","수학","사회"],"e":"선운초, 본량초","m":"선운중","h":"정광고, 보문고"},{"n":"교하점","r":"경기","a":"경기 파주시 청석로 272","l":"와와학습코칭학원 파주 교하점 경기도 파주시 청석로272 /센터프라자 803호(파리바게트 건물)","s":["수학","과학"],"e":"청석초, 석곶초, 두일초","m":"교하중, 두일중, 심학중","h":"교하고, 심학고"},{"n":"송파위례점","r":"서울","a":"서울 송파구 위례광장로 188","l":"와와학습코칭센터 송파위례점 위례 아이온스퀘어 8층 816호","s":["국어","영어","수학","과학"],"e":"송례초, 위례별초","m":"위례중, 송례중","h":"위례고, 문현고, 문정고, 덕수고"},{"n":"산본점","r":"경기","a":"경기 군포시 산본로 394","l":"경기 군포시 산본로394 602-2호( 대림프라자 6층) 주차장입구가 노란색입니다. 1층에 빽다방,이삭토스트, 본죽 산본학원가 스타벅스 옆 건물","s":["국어","영어","수학","과학"],"e":"광정초","m":"산본중, 궁내중, 수리중, 도장중, 금정중","h":"흥진고, 산본고, 군포고"},{"n":"구월점","r":"인천","a":"인천 남동구 선수촌공원로23번길 6-29","l":"아시아드 로터리, 농협 건물 근처 세무소 방향 바로 옆 건물","s":["국어","영어","수학","과학","사회"],"e":"성리초","m":"성리중","h":""},{"n":"고잔점","r":"경기","a":"경기 안산시 단원구 광덕대로 130","l":"","s":[],"e":"","m":"","h":""},{"n":"가좌점","r":"서울","a":"서울 서대문구 가재울로 52","l":"","s":["국어","영어","수학","과학","사회"],"e":"가재울초, 연가초","m":"","h":"가재울고"},{"n":"호평점","r":"경기","a":"경기 남양주시 늘을3로 65-6","l":"경기 남양주시 늘을3로 65-6 (호평동 617-3)  테마프라자2층 205호 건물 지하 무료주차 가능합니다","s":["국어","영어","수학","과학","사회"],"e":"구룡초, 호평초, 판곡초","m":"판곡중, 호평중","h":"판곡고, 호평고"},{"n":"평내점","r":"경기","a":"경기 남양주시 경춘로 1256번길 9","l":"평내상가지역 1층 메가커피건물 2층 아지트떡볶이","s":["국어","영어","수학","과학"],"e":"장내초, 호평초","m":"장내중, 호평중","h":"호평고, 금곡고, 판곡고"},{"n":"부발점","r":"경기","a":"경기 이천시 부발읍 경충대로2092번길 39-19","l":"","s":["국어","영어","수학","과학","사회"],"e":"아미초, 신하초","m":"효양중, 사동중","h":"효양고"},{"n":"율하점","r":"대구","a":"대구 동구 율하동로 32","l":"대구 동구 율하동로 32 대은빌딩 4층 (119센터 근처, 율원중 근처)","s":["국어","영어","수학","과학"],"e":"숙천초, 율원초, 율금초, 안일초","m":"율원중, 강동중, 안심중, 새론중, 신기중, 동원중","h":"동부고, 강동고, 정동고"},{"n":"비전점","r":"경기","a":"경기도 평택시 비전동 평남로 937","l":"리더스하임 후문 맞은편또는 센텀정형외과 건물 6층","s":["국어","영어","수학","과학"],"e":"이화초 가내초 자란초","m":"비전중 한광중 한광여중 평택여중 소사벌중","h":"비전고 한광고 한광여고 평택여고"},{"n":"옥길점","r":"경기","a":"경기 부천시 소사구 옥길로 116","l":"","s":["국어","영어","수학","사회"],"e":"버들초","m":"옥길중","h":"범박고"},{"n":"후곡점","r":"경기","a":"경기 고양시 일산서구 일산로 511","l":"","s":["국어","영어","수학","과학"],"e":"","m":"","h":""},{"n":"단구점","r":"강원","a":"강원특별자치도 원주시 서원대로 406","l":"단구동 롯데시네마 근처에 우리은행 건물 4층","s":["국어","영어","수학","과학","사회"],"e":"구곡초등학교, 서원주초등학교","m":"남원주중학교, 단구중학교","h":"치악고등학교, 원주고등학교"},{"n":"복대점","r":"충북","a":"충북 청주시 흥덕구 진재로 37","l":"증안초에서 하복대 방향 도보로 5분 / 아인동물병원 옆 건물 3층","s":["국어","영어","수학","과학"],"e":"증안초, 진흥초","m":"복대중, 서원중, 솔밭중","h":"흥덕고, 세광고, 사대부고, 청주고, 중앙여고"},{"n":"단대점","r":"경기","a":"경기 성남시 수정구 산성대로 423","l":"","s":["국어","영어","수학"],"e":"단대초","m":"서중, 은행중","h":"성남고, 성일고, 숭신여고, 동광고"},{"n":"은평점(W+)","r":"서울","a":"서울 은평구 진관2로 19","l":"","s":["수학"],"e":"진관초, 신도초, 은진초","m":"진관중, 신도중, 연천중","h":"진관고, 신도고, 대성고, 선일여고, 동명여고"},{"n":"산내점","r":"경기","a":"경기 파주시 청암로17번길 21","l":"","s":["국어","영어","수학"],"e":"","m":"","h":""},{"n":"동춘점","r":"인천","a":"인천 연수구 앵고개로264번길 40","l":"","s":["국어","영어","수학","과학"],"e":"","m":"","h":"대건고, 연수여고, 연수고"},{"n":"후곡점(W+)","r":"경기","a":"경기 고양시 일산서구 일산로 524","l":"","s":["국어","영어","수학","과학"],"e":"","m":"","h":""},{"n":"알파시티점","r":"대구","a":"대구 수성구 알파시티2로 19","l":"대구 수성구 알파시티2로19 와와학습코칭학원 201호","s":["국어","영어","수학","과학","사회"],"e":"노변초, 고산초","m":"노변중, 고산중","h":"시지고, 덕원고"},{"n":"신월성점","r":"대구","a":"대구 달서구 월성동","l":"","s":["국어","영어","수학","과학"],"e":"조암초, 신월초, 월암초, 월성초","m":"조암중, 월암중, 월서중, 효성중, 영남중, 대건중, 학산중","h":"영남고, 상원고, 효성여고, 송현여고, 상인고"},{"n":"대구역점","r":"대구","a":"대구 중구 서성로 99","l":"수창공원 맞은편 1층 몬스터커피에서 왼쪽 건물 3층","s":["국어","영어","수학","과학","사회"],"e":"수창초, 달성초, 종로초","m":"계성중, 성명여중, 사대부중","h":"사대부고, 경북여고, 신명고, 대구고, 경북예고, 칠성고"},{"n":"신방화점","r":"서울","a":"서울 강서구 방화대로 294","l":"신방화역 6번출구에서 나와서 바로 왼쪽 마곡 더블유타워","s":["영어","수학","사회"],"e":"송화초, 공항초","m":"공항중, 송정중","h":"한서고, 공항고"},{"n":"청라점","r":"인천","a":"인천 서구 중봉대로 588","l":"","s":["국어","영어","수학","과학"],"e":"","m":"청라중, 해원중","h":"청라고, 해원고"},{"n":"소하점","r":"경기","a":"경기 광명시 오리로 346","l":"","s":["국어","영어","수학","과학"],"e":"충현초, 서면초","m":"충현중, 빛가온중","h":"충현고, 광휘고, 소하고"},{"n":"복산점","r":"울산","a":"울산 중구 번영로 461","l":"","s":["국어","영어","수학","과학","사회"],"e":"","m":"","h":""},{"n":"동탄호수점","r":"경기","a":"경기 화성시 동탄순환대로 127-19","l":"우성 상가촌 동탄성모병원 건물 9층","s":["국어","영어","수학","과학","사회"],"e":"방교초, 서연초","m":"청림중, 서연중, 방교중","h":"정현고, 서연고, 창의고"},{"n":"동백점","r":"경기","a":"경기도 용인시 기흥구 중동 동백3로11번길 3","l":"경기도 용인시 기흥구 중동 851-4 동백역타워 2층 201호. 1층에 파찌내 만둣가게가 있는 건물 2층 입니다. 동백역2번 출구 50m 이내 ","s":["국어","영어","수학","과학"],"e":"석성초, 초당초","m":"초당중, 백현중, 동백중, 성지중, 어정중, 용인중","h":"초당고, 백현고, 동백고, 성지고, 용인고"},{"n":"노형점","r":"제주","a":"제주특별자치도 제주시 노형동 727-3 대안빌딩","l":"제주은행 연북로지점 주차장 뒷편 cu건물3층","s":["국어","영어","수학","과학","사회"],"e":"노형초","m":"서중, 중앙중","h":"지역내 모든 고등학교 가능"},{"n":"장기점","r":"경기","a":"경기도 김포시 장기동 김포한강4로 162","l":"","s":["국어","영어","수학","과학","사회"],"e":"푸른솔초, 운유초","m":"장기중, 푸른솔중, 고창중","h":"솔터고, 제일고, 운양고, 통진고"},{"n":"좌동점","r":"부산","a":"부산광역시 해운대구 좌동 좌동로 88","l":"부산 2호선 장산역 10번 출구 도보 10분 거리, 1층 장독대(반찬)/호두과자 가게 있습니다.","s":["국어","영어","수학","과학","사회"],"e":"동백초, 부흥초, 신도초","m":"신도중, 부흥중, 신곡중, 해운대중, 해강중","h":"신도고, 양운고, 부흥고, 해운대여고, 해강고"},{"n":"신방점","r":"기타","a":"충청남도 천안시 동남구 신방동 886 학산프라자","l":"세종약국(이석훈내과와 늘푸른이비인후과가 있는 건물) 3층입니다. 신방점 리처드헤어본점 맞은편 학산프라자 5층건물 3층에 있습니다.","s":["국어","영어","수학"],"e":"신용초","m":"용곡중, 신방중","h":"청수고, 쌍용고, 천안여고"},{"n":"쌍용점","r":"기타","a":"충청남도 천안시 서북구 쌍용동 불당대로 260","l":"고3  영어 수업은 어렵습니다","s":["국어","영어","수학"],"e":"쌍용초","m":"쌍용중","h":"쌍용고, 월봉고, 중앙고, 천안여고"},{"n":"병점점","r":"경기","a":"경기 화성시 병점1로 221","l":"병점 중심상가 사거리 롯데리아 건물 2층 (엘리베이터 내리면 바로 위치)  설빙과 같은 층입니다.  와와 병점점 031) 297 - 7325","s":["국어","영어","수학","과학","사회"],"e":"진안초, 안화초, 병점초, 송화초, 구봉초","m":"진안중, 병점중, 안화중","h":"병점고, 안화고, 능동고"},{"n":"불당점","r":"충남","a":"충남 천안시 서북구 불당33길 22","l":"","s":["국어","영어","수학"],"e":"","m":"","h":""},{"n":"웰카운티점","r":"인천","a":"인천 연수구 인천타워대로54번길 15-5","l":"북일프라자 1차가 아닌 MUZE건물 2층 북일프라자 2층입니다  북일프라자 2층, 뮤즈카페 건물위 2층입니다","s":["국어","영어","수학"],"e":"해송초등학교","m":"해송중학교, 능허대중학교, 박문중학교","h":"해송고등학교, 연송고등학교, 대건고등학교"},{"n":"중산점","r":"경기","a":"경기 고양시 일산동구 중산로 103","l":"일산동구 중산로 103 거풍프라자 202호","s":["국어","영어","수학"],"e":"모당초, 안곡초, 중산초","m":"안곡중, 중산중, 일산중","h":"안곡고, 중산고"},{"n":"가경점","r":"충북","a":"충북 청주시 흥덕구 서현북로 18","l":"서현북로 대원칸타빌과 가경 e편한세상 사이 편의점 CU맞은편","s":["국어","영어","수학","사회"],"e":"서현초, 서경초","m":"서현중, 경덕중, 서현중","h":"사대부고, 서원고, 청주외고"},{"n":"탕정점(모두)","r":"충남","a":"충남 아산시 탕정면 한들물빛5로 5","l":"한들물빛도시 지웰시티 센트럴 프루지오 206동 맞은편 젤존 메디컬시티 605호","s":["국어","영어","수학","과학","사회"],"e":"한들물빛초","m":"한들물빛중","h":"설화고"},{"n":"이시아폴리스점","r":"대구","a":"대구 동구 팔공로51길 33","l":"이시아폴리스 더샵3차아파트 맞은편 이스트 애플빌딩 5층","s":["국어","영어","수학","과학","사회"],"e":"봉무초, 영신초","m":"영신중, 팔공중, 복현중, 성광중, 성화중, 동촌중","h":"영신고, 경상고, 영진고, 성광고, 성화여고"},{"n":"신봉점","r":"경기","a":"경기 용인시 수지구 신봉2로 60","l":"신봉 LG자이2차 옆 웰스톤시티상가 1층, 농협복도 끝에 위치","s":["국어","영어","수학","과학","사회"],"e":"신봉초, 신일초, 홍천초, 신리초, 성복초","m":"신봉중, 성복중, 홍천중","h":"신봉고, 용인홍천고"},{"n":"퇴계원점","r":"경기","a":"경기 남양주시 퇴계원읍 퇴계원로 29","l":"경기도 남양주시 퇴계원로 29 송백타운 202호 와와학습코칭학원 퇴계원점  판다팜건물 2층   퇴계원역 4거리에서 2분거리","s":["국어","영어","수학"],"e":"퇴계원초, 도제원초, 태강삼육초","m":"퇴계원중, 진건중","h":"퇴계원고, 진건고"},{"n":"마포점","r":"서울","a":"서울특별시 마포구 염리동 독막로42길 7","l":"지하철5호선 마포역, 6호선 공덕역 하차후 염리초등학교 방향으로 10분도보","s":["국어","영어","수학","과학","사회"],"e":"염리초","m":"서울여중, 동도중, 신수중, 숭문중","h":"서울여고, 숭문고, 광성고"},{"n":"용인백현점(모두)","r":"경기","a":"경기 용인시 기흥구 동백7로 83","l":"동백고등학교 건너편 상가 중에 중앙프라자 2층에 위치한 모두오름 학습코칭학원","s":["국어","영어","수학","과학","사회"],"e":"동막초, 동백초, 용인백현초","m":"동백중, 용인백현중","h":"동백고, 용인백현고"},{"n":"대구역점2호관","r":"대구","a":"대구 중구 서성로 99","l":"수창공원 맞은편 대구역센트릴자이아파트 상가 2층","s":["국어","영어","수학","과학","사회"],"e":"수창초, 종로초","m":"계성중, 성명여중, 대구제일중, 사대부중","h":"사대부고, 경북여고, 신명고, 칠성고"},{"n":"운정중앙점","r":"경기","a":"경기도 파주시 양지로 131, 운정SB타워 509호,510호 (동패동)","l":"초롱꽃마을 12단지(대림이편한세상아파트)와 13단지(디에트르아파트) 사이 상가건물들 중 버거킹건물 5층","s":["국어","영어","수학","과학"],"e":"초롱초","m":"심학중","h":"심학고"},{"n":"충주용산점","r":"충북","a":"충북 충주시 형설로 54-10,2층 (용산동)","l":"충주중학교 정문으로 오세요","s":["국어","영어","수학","과학","사회"],"e":"남산초, 용산초","m":"예성여중, 미덕중","h":"충주여고, 예성여고, 충주고"},{"n":"진천점(모두)","r":"대구","a":"대구광역시 달서구 조암남로 158,301호(유천동)","l":"AK그랑폴리스와 쌍용예가 사이에 있는 건물(그랑에비뉴) 3층 가장 왼쪽 학원","s":["국어","영어","수학","과학","사회"],"e":"한솔초, 한샘초","m":"월서중, 조암중","h":""},{"n":"별내중앙점(모두)","r":"경기","a":"경기도 남양주시 별내3로 66,401호","l":"우체국과 홈플러스 사이건물 4층입니다!","s":["영어","수학","과학"],"e":"한별초","m":"화접중, 한별중","h":"별내고"},{"n":"목동점","r":"서울","a":"서울 양천구 목동동로8길 23","l":"","s":["국어","영어","수학","과학","사회"],"e":"신목초, 서정초","m":"목일중, 신목중, 양강중, 금옥중","h":"양천고, 신목고, 한광고, 서울영상고"},{"n":"신도림점","r":"서울","a":"서울특별시 구로구 신도림동 신도림로 20","l":"구로구 신도림로 20 해동빌딩4층(신미림초등학교옆)","s":["국어","영어","수학","과학"],"e":"신미림초","m":"신도림중","h":"신도림고, 구현고"},{"n":"제기점","r":"서울","a":"서울 동대문구 왕산로 61","l":"","s":["국어","영어","수학","과학","사회"],"e":"용두초, 종암초, 기타사립초","m":"대광중, 성일중","h":"대광고, 청량리고, 경희고"},{"n":"종암점","r":"서울","a":"서울 성북구 종암로27길 13","l":"종암로27길 13 도원프라자 5층 (메가커피 건물) 성북소방서와 GS 주유소 사이길로 들어오시면 소방서 바로 옆 건물입니다~","s":["국어","영어","수학","과학"],"e":"","m":"종암중, 사대부중, 개운중","h":"사대부고, 용문고"},{"n":"명일점","r":"서울","a":"서울 강동구 양재대로 1606","l":"","s":["국어","영어","수학"],"e":"","m":"천호중, 배재중, 명일중","h":"명일여고, 강동고, 광문고"},{"n":"구산점","r":"서울","a":"서울특별시 은평구 역촌동 연서로 130","l":"","s":["국어","영어","수학"],"e":"","m":"구산중, 은평중","h":"예일여중고, 선일여중고"},{"n":"내발산점","r":"서울","a":"서울 강서구 마곡중앙4로 74","l":"내발산역에서 우장산역 방향으로 걸어오시다보면 소방서 앞에 육교가 있는데 육교앞 건물입니다. 1층에 커피숍과 딤채가 있습니다.","s":["국어","영어","수학","과학","사회"],"e":"가곡초, 내발산초","m":"등명중, 화곡중, 명덕중, 덕원중","h":"화곡고, 명덕고, 덕원여고, 마포고"},{"n":"금천점","r":"서울","a":"서울 금천구 금하로 763","l":"금천구 시흥2동 주민센터 건너편 벽산중심상가 3층","s":["국어","영어","수학","과학","사회"],"e":"탑동초","m":"동일중, 세일중","h":"매그넷고, 동일여고, 금천고, 문일고"},{"n":"위례점","r":"경기","a":"경기 성남시 수정구 위례광장로 320","l":"","s":["국어","영어","수학","과학"],"e":"고운초, 위례중앙초, 송례초","m":"위례한빛중, 위례중앙중, 송례중","h":"위례한빛고, 복정고, 문현고"},{"n":"상현점","r":"경기","a":"경기도 용인시 수지구 상현동 만현로 120","l":"상현동 sr프라자 4층","s":["국어","영어","수학","과학"],"e":"솔개초, 상현초, 이현초","m":"서원중, 소현중, 이현중, 성복중","h":"상현고, 서원고, 풍덕고, 이의고, 홍천고"},{"n":"사우점","r":"경기","a":"경기 김포시 사우중로 77","l":"","s":["국어","영어","수학","과학","사회"],"e":"금파초, 향산초","m":"금파중, 김포중","h":"사우고, 풍무고, 고촌고"},{"n":"수지점(W+)","r":"경기","a":"경기 용인시 수지구 진산로 106","l":"","s":["국어","영어","수학","과학","사회"],"e":"","m":"이현중, 수지중, 정평중","h":"성복고, 풍덕고, 수지고, 죽전고"},{"n":"새롬점","r":"세종","a":"세종특별자치시 새롬중앙로 62-15","l":"","s":["국어","영어","수학"],"e":"새뜸초, 새롬초","m":"새뜸중, 새롬중","h":"새롬고, 다정고"},{"n":"삼산점","r":"울산","a":"울산광역시 남구 삼산동 돋질로 300","l":"","s":["국어","영어","수학","과학","사회"],"e":"","m":"","h":""},{"n":"상남점","r":"경남","a":"경남 창원시 성산구 마디미동로 25","l":"상남동 한마음병원 횡단보도 맞은편 건물 3층에 위치","s":["영어","수학"],"e":"외동초","m":"상남중, 토월중, 웅남중","h":"창원중앙여고, 남고, 신월고, 토월고"},{"n":"향남점","r":"경기","a":"경기 화성시 향남읍 발안로 103-6","l":"","s":["국어","영어","수학"],"e":"한울초, 도이초","m":"발안중, 향남중, 하길중, 화성중","h":"향남고, 향일고, 하길고, 발안바이오고"},{"n":"동래점","r":"부산","a":"부산광역시 동래구 온천동 충렬대로 129-1","l":"건강검진센터와 동래맥도널드 사이 / 횡단보도 근처 / 건겅검진센터에서 미남역으로 한 블럭","s":["국어","영어","수학","과학"],"e":"내산초","m":"내성중,유락여중,동래중,동해중","h":"내성고,중앙여고,동래고,부산전자고"},{"n":"장곡점","r":"경기","a":"경기 시흥시 진말로 7","l":"장곡동 에이스마트 맞은편 '미소신협'건물 3층 와와학습코칭학원","s":["영어","수학","과학"],"e":"장곡초, 진말초","m":"응곡중, 장곡중, 가온중","h":"장곡고, 능곡고, 시흥고"},{"n":"갈산점","r":"경기","a":"경기도 이천시 갈산동 영창로 314","l":"","s":["국어","영어","수학","사회"],"e":"안흥초, 설봉초","m":"이천중, 설봉중, 증포중","h":"제일고, 이현고"},{"n":"금릉점","r":"경기","a":"경기 파주시 금빛로 24-27","l":"1층 용우동,복호두있는 건물 5층입니다. 눈높이 옆에있습니다.","s":["국어","영어","수학","과학","사회"],"e":"금릉초, 금화초, 새금초, 금촌초","m":"금릉중, 금촌중, 문산중","h":"금촌고, 문산제일고"},{"n":"반달점","r":"경기","a":"경기 부천시 원미구 상일로 69","l":"경기도 부천시 상일로 69 반달마을 상가동 304호  (주차는 아파트 입구에서 상가 304호 방문이라고 하면 됩니다)","s":["영어","수학","과학"],"e":"부인초, 상도초","m":"부인중, 상동중","h":"상원고"},{"n":"관평점","r":"대전","a":"대전 유성구 관평2로 46","l":"지도 사진과 함께 동화중학교 맞은편/ 주민센터 뒷 건물 로 설명 드립니다.","s":["국어","영어","수학"],"e":"동화초, 관평초","m":"동화중, 관평중","h":"중일고, 용산고"},{"n":"개신점","r":"기타","a":"충청북도 청주시 서원구 개신동 경신로 31-1","l":"청주시 서원구 경신로 31-1 스타타워빌딩 4층 (개신동 농협사거리, 1층에 롯데리아 개신점이 있는 건물의 4층입니다.)","s":["국어","영어","수학","과학"],"e":"개신초, 서경초, 가경초, 죽림초, 서원초","m":"가경중, 서경중, 경덕중, 사대부중, 성화중, 서원중","h":"서원고, 사대부고, 청주고, 중앙여고, 운호고, 봉명고, 흥덕고, 세광고"},{"n":"상동점","r":"경기","a":"경기 부천시 원미구 송내대로265번길 67","l":"진달래마을 정문 앞  청담 어학원 옆건물","s":["국어","영어","수학"],"e":"석천초  상인초","m":"석천중 상동중 상일중 부인중","h":"상동고 상일고 상원고 중흥고 중원고"},{"n":"논현점","r":"인천","a":"인천 남동구 청능대로 559","l":"인천 논현역 3번 출구에서 직진 200M 논현 메디컬 센터 2층","s":["국어","영어","수학"],"e":"동방초, 원동초","m":"고잔중","h":"고잔고"},{"n":"광명점","r":"경기","a":"경기 광명시 광명로 823","l":"","s":["국어","영어","수학"],"e":"","m":"광남중, 광문중","h":"광문고"},{"n":"정평점","r":"경북","a":"경북 경산시 대학로 23","l":"","s":["국어","영어","수학","과학","사회"],"e":"사월초","m":"경산중, 사동중, 경산여중","h":"경산고, 사동고, 경산여고, 문경고"},{"n":"영천점","r":"경기","a":"경기 화성시 동탄순환대로 704","l":"","s":["국어","영어","수학"],"e":"한백초, 다원초","m":"한백중, 다원중","h":"한백고, 이산고, 창의고"},{"n":"송도점","r":"인천","a":"인천 연수구 해돋이로 165","l":"백제원 근처, 채드윅 근처, 1공구 학원가","s":["국어","영어","수학","과학","사회"],"e":"신정초","m":"신정중","h":"연송고"},{"n":"둔산점","r":"대전","a":"대전광역시 서구 둔산동 둔산로 142","l":"시청역 7번 출구쪽 스타벅스&올리브영 건물 4층.","s":["국어","영어","사회"],"e":"","m":"","h":""},{"n":"관저점","r":"대전","a":"대전 서구 구봉로 133","l":"마치광장 신협건물 2층","s":["국어","영어","수학","과학","사회"],"e":"","m":"","h":"서일고, 서일여고"},{"n":"전주혁신점","r":"전북","a":"전북특별자치도 완주군 이서면 출판로 42","l":"전주 혁신도시 호반 베르디움 1차 맞은편 상가 / 굽네치킨 건물 4층","s":["영어","수학","과학","사회"],"e":"","m":"양현중, 삼우중, 만성중","h":"양현고"},{"n":"주엽점","r":"경기","a":"경기도 고양시 일산서구 주엽동 주화로 88","l":"","s":["국어","영어","수학","사회"],"e":"강선초","m":"","h":""},{"n":"주엽2호점","r":"경기","a":"경기 고양시 일산서구 중앙로 1413","l":"","s":["영어","수학","과학"],"e":"강선초","m":"","h":""},{"n":"다산점","r":"경기","a":"경기 남양주시 다산중앙로146번길 12-14","l":"","s":["국어","영어","사회"],"e":"다산초","m":"다산중","h":"다산고, 도농고"},{"n":"비산점","r":"경기","a":"경기 안양시 동안구 관악대로 91","l":"경기 안양시 동안구 관악대로 91 대림타워 1102호 와와학습코칭학원","s":["국어","영어","수학"],"e":"중앙초","m":"비산중, 부흥중, 부림중, 신성중","h":"양명여고, 양명고, 관양고, 성문고, 동안고"},{"n":"두정점","r":"기타","a":"충청남도 천안시 서북구 두정동 봉정로 382","l":"두정초 정문 앞, 8단지 맞은편 피자마루 건물 3층,","s":["영어","수학"],"e":"두정초, 신대초","m":"두정중, 성성중, 성정중,","h":"오성고, 두정고, 신당고, 업성고"},{"n":"원주시청점","r":"강원","a":"강원특별자치도 원주시 시청로 22","l":"원주시청 등지고 오른쪽 첫번째 버스정류장 옆건물(1층에 피자알볼로)","s":["영어","수학","과학"],"e":"만대초, 무실초","m":"대성중, 평원중, 원주여중, 남원주중","h":"대성고, 육민관고, 북원여고"},{"n":"오산대역점","r":"경기","a":"경기 오산시 내삼미로 85","l":"","s":["국어","영어","수학","과학","사회"],"e":"세미초, 화성초, 수청초","m":"매홀중, 세마중, 문시중, 대호중","h":"매홀고, 세교고, 오산고, 운천고, 운암고"},{"n":"신창점","r":"광주","a":"광주 광산구 신창로 129","l":"신창동 파리바게트 1호점 3층입니다.","s":["영어","수학","과학"],"e":"신창초, 수문초","m":"진흥중, 신창중, 진흥중","h":"숭덕고, 성덕고, 운남고, 장덕고"},{"n":"칠곡점","r":"대구","a":"대구 북구 구암로 149","l":"","s":["국어","영어","수학","과학"],"e":"관음초","m":"구암중, 관천중, 운암중","h":"구암고, 함지고, 영송여고"},{"n":"운정점","r":"경기","a":"경기 파주시 동패동","l":"","s":["국어","영어","수학","과학"],"e":"한가람초","m":"","h":""},{"n":"다산지금점","r":"경기","a":"경기 남양주시 다산지금로 139","l":"스타벅스 다산지금점 건물 3층(영신프라자)입니다.","s":["국어","영어","수학","과학","사회"],"e":"다산한강초","m":"다산한강중","h":""},{"n":"수성만촌점","r":"대구","a":"대구 수성구 화랑로8길 11-11","l":"","s":["국어","영어","수학","과학","사회"],"e":"","m":"동중","h":""},{"n":"천천점","r":"경기","a":"경기 수원시 장안구 덕영대로535번길 34","l":"롯데마트 천천점 옆건물(건강과 행복 약국& 봉구스밥버거 1층)그린프라자 5층","s":["국어","영어","수학","과학","사회"],"e":"천천초 정천초","m":"천천중 대평중","h":"천천고 영생고 대평고"},{"n":"산남점","r":"기타","a":"충청북도 청주시 서원구 산남동 산남로 18","l":"하나로 마트 건물 옆 1층 조은약국 건물","s":["국어","영어","수학","과학","사회"],"e":"샛별초","m":"수곡중 산남중","h":"충북고 운호고 충북여고 산남고"},{"n":"석사점","r":"강원","a":"강원특별자치도 춘천시 지석로 85","l":"지석로 85 강남프라자 7층 ( 투탑시티 카펠라 휘트니스 건너편 건물)","s":[],"e":"성림초, 성원초, 봄내초","m":"대룡중, 우석중, 남춘천중, 남춘천여중, 춘천중, 강원중","h":"강원고, 사대부고, 춘고, 춘여고, 봉의고, 성수여고, 유봉여고"},{"n":"후평점","r":"강원","a":"강원특별자치도 춘천시 춘천로 316","l":"후평사거리 포스코상가 3층 (정육점 건물 3층으로 말하시면 많이들 아십니다)","s":["영어","수학"],"e":"","m":"후평중, 봉의중, 강원중","h":"강원고, 춘천여고, 봉의고"},{"n":"옥계점","r":"경북","a":"경북 구미시 산호대로31길 16","l":"구미시 산호대로 31길 16 2층","s":["국어","영어","수학","과학"],"e":"원당초, 옥계동부초, 해마루초","m":"옥계동부중, 해마루중, 옥계중","h":"산동고, 오상고, 금오여고"},{"n":"당진중앙점","r":"충남","a":"충남 당진시 당진중앙2로 211-5","l":"","s":["국어","영어","수학","과학","사회"],"e":"탑동초","m":"호서중, 당진중","h":"호서고, 당진고"},{"n":"미사점","r":"경기","a":"경기 하남시 미사강변대로 212","l":"https://naver.me/xhHGgP9o  학원 위치 안내드립니다^^~미사도서관이나 보건센터에서 도보로 2분 거리입니다.","s":["국어","영어","수학","과학"],"e":"","m":"","h":""},{"n":"영통점","r":"경기","a":"경기도 수원시 영통구 영통동 봉영로 1623","l":"영통역과 청명역 중간에 버거킹 건물 3층입니다.","s":["국어","영어","수학","과학","사회"],"e":"영덕초","m":"흥덕중, 서천중","h":"영덕고, 청명고, 태장고, 흥덕고, 서천고"},{"n":"망포점","r":"경기","a":"경기도 수원시 영통구 망포동 영통로 127","l":"","s":["국어","영어","수학","과학","사회"],"e":"잠원초, 망포초, 대선초","m":"영동중, 잠원중, 망포중, 동학중","h":"태장고, 망포고"},{"n":"강릉교동점","r":"강원","a":"강원특별자치도 강릉시 정원로 44","l":"","s":["영어","수학"],"e":"율곡초, 경포초","m":"관동중, 율곡중, 해람중, 솔올중, 경포중","h":"강여고, 강일여고, 명륜고, 제일고, 강릉고"},{"n":"서수원점","r":"경기","a":"경기 수원시 권선구 호매실로104번길 90","l":"","s":["국어","영어","수학","과학","사회"],"e":"능실초, 금호초","m":"오현초호매실중, 능실중, 영신중, 고색중","h":"호매실고, 영신여고, 고색고, 율천고, 동우여고"},{"n":"원당점","r":"경기","a":"경기 고양시 덕양구 고양대로1384번길 7-5","l":"","s":["국어","영어","수학"],"e":"","m":"성사중, 화수중","h":""},{"n":"송도점(W+)","r":"인천","a":"인천 연수구 해돋이로 160-6","l":"백제원 근처, 백제원 앞 랜드로버 방향 옆건물, 1층에 명월카츠","s":["수학","과학"],"e":"신정초","m":"신정중","h":"연송고"},{"n":"운양점","r":"경기","a":"경기 김포시 김포한강11로 288-37","l":"경기 김포시 운양동 1296-7 헤리움'리버테라스' 205호입니다 엘레베이터 열리고 바로 왼쪽으로 오시면 됩니다~","s":["국어","수학","사회"],"e":"하늘빛초, 청수초","m":"하늘빛중, 운양중, 푸른솔중","h":"제일고, 운양고, 운유고"},{"n":"도안점","r":"대전","a":"대전 서구 동서대로 692","l":"","s":["영어","수학","과학"],"e":"흥도초","m":"유성중, 봉명중, 도안중","h":"유성고, 도안고, 서대전여고"},{"n":"시흥대야점","r":"경기","a":"경기 시흥시 은행로167번길 7","l":"","s":["국어","영어","수학"],"e":"은계초, 은행초","m":"은행중, 은계중","h":"은행고"},{"n":"둔산점(W+)","r":"대전","a":"대전 서구 둔산로 130","l":"시청역 7번 출구쪽 30m","s":["수학","과학"],"e":"","m":"","h":""},{"n":"반여점","r":"부산","a":"부산 해운대구 반여로 102","l":"아시아선수촌 정문 건너편 깨비블럭있는 건물 5층","s":["국어","영어","수학","과학"],"e":"인지초, 장산초, 무정초","m":"장산중, 인지중","h":"반여고"},{"n":"화명점","r":"부산","a":"부산 북구 금곡대로285번길 19","l":"일방통행길 빽다방 건물 5층, 또는 코오롱하늘채 2차 정문 앞 상가","s":["국어","영어","수학","과학"],"e":"와석초","m":"명진중, 화명중","h":"화명고,  성도고"},{"n":"보라점","r":"경기","a":"경기 용인시 기흥구 사은로126번길 6","l":"쌍용아파트 입구 줄넘기 학원 건물 3층","s":["국어","영어","수학","과학"],"e":"나곡초","m":"나곡중/보라중/상갈중","h":"보라고/신갈고"},{"n":"대구장기점","r":"대구","a":"대구 달서구 장기로 252","l":"버스정류장(장동초등학교앞) 바로 앞 대로변에 있습니다.  장기협성휴포레 상가 2층 (1층에 한솥 도시락이 있습니다)","s":["국어","영어","수학","과학","사회"],"e":"장동초, 장기초, 성당초","m":"원화중","h":""},{"n":"범박점","r":"경기","a":"경기 부천시 소사구 은성로 132","l":"부천 은성로132 제일프라자 501호 (세븐일레븐건물 5층)","s":["국어","영어","수학","과학","사회"],"e":"창영초, 소안초, 소사초, 복사초","m":"일신중, 소사중, 부일중","h":"시온고, 소사고, 범박고"},{"n":"위례창곡점","r":"경기","a":"경기 성남시 수정구 위례동로 141","l":"경기도 성남시 수정구 위례동로 141 우성메디피아 401호  1층컴포즈커피","s":["국어","영어","수학"],"e":"","m":"","h":""},{"n":"혁신점","r":"강원","a":"강원특별자치도 원주시 입춘로 110","l":"","s":["영어","수학"],"e":"버들초, 반고초","m":"버들중, 반곡중","h":""},{"n":"원흥점","r":"경기","a":"경기 고양시 덕양구 권율대로 672","l":"원흥역 1번 출구 앞 1층 베스킨 라빈스 있는 건물 2층 217호","s":["국어","영어","수학"],"e":"원흥초, 삼송초","m":"원흥중, 고양중","h":"신원고, 서정고"},{"n":"거제수월점","r":"경남","a":"경남 거제시 수양로 462","l":"수월사거리 파리바게트 맞은편 skT월드 건물 3층","s":["영어","수학"],"e":"수월초, 제산초","m":"수월중, 거제중앙중","h":"거제중앙고, 연초고, 상문고"},{"n":"덕이점","r":"경기","a":"경기 고양시 일산서구 하이파크2로 40","l":"금문프라자(농협 옆건물, 1층에 컴포즈 카페있는 건물, 7층 헬스장 바로 위 8층입니다)","s":["국어","영어","수학"],"e":"한산초, 덕이초, 백송초","m":"","h":""},{"n":"삼송점","r":"경기","a":"경기 고양시 덕양구 신원로 36","l":"신원마을6단지 맞은편 상가-명승세도나3차 맘스터치있는 건물 7층","s":["국어","영어","수학","과학","사회"],"e":"신원초","m":"신원중","h":"신원고"},{"n":"진월점","r":"광주","a":"광주 남구 광복마을길 47","l":"광주광역시 남구 광복마을길 47 4층","s":["영어","수학"],"e":"진월초, 주월초","m":"동성여중, 주월중","h":"대광여고, 동성고"},{"n":"이충점","r":"경기","a":"경기 평택시 이충로 49-31","l":"이충상가 농협 옆건물 삼원프라자 2층, 1층 정관장 건물","s":["국어","영어","수학","과학"],"e":"","m":"효명중, 이충중, 은혜중","h":"이충고, 은혜고, 효명고"},{"n":"루원시티점","r":"인천","a":"인천 서구 새오개로111번안길 23","l":"","s":["국어","영어","수학"],"e":"가현초","m":"신형중, 신현여중, 가현중","h":"신현고"},{"n":"복현점","r":"대구","a":"대구 북구 동북로 247","l":"대구 북구 복현동 713 e편한세상복현 상가동 305호","s":["국어","영어","수학"],"e":"복현초","m":"북중, 성광중, 산격중","h":"경상고, 성광고, 영진고"},{"n":"진접점","r":"경기","a":"경기 남양주시 진접읍 해밀예당1로 171","l":"","s":["국어","영어","수학"],"e":"","m":"","h":""},{"n":"사직점","r":"부산","a":"부산 동래구 사직로 80","l":"부산시 동래구 사직로 80 쌍용예가상가 222동 311호 (상가 두개 중 맑은샘사우나가 있는 상가 3에 위치)","s":["영어","수학"],"e":"예원초, 사직초","m":"사직중, 사직여중","h":"사직고, 사직여고, 동인고"},{"n":"운정호수점","r":"경기","a":"경기 파주시 경의로1240번길 37-1","l":"운정역1번출구에서 걸어서 7분, 가람도서관 건너편, 할리스건물","s":["국어","영어","수학","과학","사회"],"e":"","m":"","h":""},{"n":"탄벌점","r":"경기","a":"경기 광주시 벌원길 61","l":"","s":["국어","영어","수학","과학"],"e":"","m":"","h":""},{"n":"남외점","r":"울산","a":"울산 중구 남외3길 15","l":"남외초앞 파리바게트 사거리 마트위 4층","s":["국어","영어","수학"],"e":"남외초","m":"남외중,울산중","h":"울산고,가온고"},{"n":"흥덕점","r":"경기","a":"경기 용인시 기흥구 흥덕2로 85","l":"용인 흥덕 이마트 뒷편 세차장 옆건물 2층입니다.(경기도 용인시 흥덕2로 85 우연프라자 201호)","s":["국어","영어","수학","과학","사회"],"e":"샘말초, 석현초, 흥덕초, 매원초","m":"흥덕중, 다산중, 광교호수중, 상현중","h":"흥덕고, 기흥고, 신갈고, 상현고, 매원고"},{"n":"반송점","r":"경기","a":"경기도 화성시 반송동 동탄원천로 163","l":"","s":["국어","영어","수학","과학","사회"],"e":"","m":"","h":""},{"n":"돈암점","r":"서울","a":"서울특별시 성북구 돈암동 동소문로 190","l":"성신여대역 1번출구, 직진 버스 1정거장  기아자동차 건물 2층","s":["국어","영어","수학"],"e":"개운초","m":"개운중, 성신여중, 고명중","h":"용문고, 사대부고, 성신여고, 고대부고"},{"n":"동소문점","r":"서울","a":"서울 성북구 아리랑로7길 5","l":"할머니문방구 사거리 건물 4층","s":["영어","수학"],"e":"정덕초, 우촌초, 정수초","m":"성신여중, 동구여중, 삼선중, 고명중","h":"성신여고, 홍대부고, 고대부고, 한성여고"},{"n":"상암점","r":"서울","a":"서울특별시 마포구 상암동 상암산로1길 73","l":"","s":["영어","수학"],"e":"중동초, 상지초, 상암초","m":"상암중, 중암중, 성산중, 성사중, 덕은한강중","h":"상암고, 예일여고, 대성고, 숭실고, 가재울고"}];

// --- 학원 전국 지점 페이지 ---
function renderAcademyList() {
  const regionOrder = ["전체","서울","경기","인천","부산","대구","대전","광주","울산","세종","강원","충북","충남","전북","전남","경북","경남","제주"];
  
  return `<!DOCTYPE html><html lang="ko"><head>
  ${commonHead('전국 학원 지점 찾기 - 과외안하니', '전국 205개 학원 지점 정보를 한눈에! 내 주변 학원을 찾아보세요.', 'https://anhani.com/학원/전국지점')}
  <style>${commonStyles()}
    .ac-wrap { max-width: 1000px; margin: 0 auto; padding: 48px 24px 80px; }
    .ac-label { display: inline-block; background: #6366f1; color: #fff; font-size: 13px; font-weight: 700; padding: 4px 14px; border-radius: 20px; margin-bottom: 16px; }
    .ac-title { font-size: 32px; font-weight: 900; color: #0f172a; margin-bottom: 8px; }
    .ac-title em { font-style: normal; color: #6366f1; }
    .ac-subtitle { font-size: 15px; color: #64748b; margin-bottom: 12px; }
    .ac-count { font-size: 14px; color: #6366f1; font-weight: 700; margin-bottom: 32px; }
    
    .ac-search { display: flex; gap: 8px; margin-bottom: 24px; }
    .ac-search input { flex: 1; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; outline: none; }
    .ac-search input:focus { border-color: #6366f1; }
    .ac-search button { padding: 12px 24px; background: #6366f1; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
    
    .ac-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
    .ac-tab { padding: 8px 18px; border-radius: 20px; border: 1.5px solid #d1d5db; background: #fff; font-size: 14px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
    .ac-tab:hover { border-color: #6366f1; color: #6366f1; }
    .ac-tab.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    
    .ac-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .ac-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px 20px; transition: all 0.2s; }
    .ac-card:hover { border-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,0.1); transform: translateY(-3px); }
    .ac-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .ac-card-name { font-size: 18px; font-weight: 800; color: #0f172a; }
    .ac-card-region { display: inline-block; background: #eef2ff; color: #6366f1; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; }
    .ac-card-addr { font-size: 13px; color: #64748b; margin-bottom: 10px; line-height: 1.5; }
    .ac-card-loc { font-size: 12px; color: #94a3b8; margin-bottom: 12px; line-height: 1.4; }
    .ac-card-subjects { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .ac-subj { padding: 3px 10px; background: #f0fdf4; color: #15803d; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .ac-card-schools { font-size: 11px; color: #94a3b8; line-height: 1.5; }
    .ac-card-schools b { color: #64748b; font-weight: 600; }
    .ac-empty { text-align: center; padding: 60px 20px; color: #94a3b8; font-size: 16px; }
    
    @media (max-width: 640px) {
      .ac-title { font-size: 24px; }
      .ac-grid { grid-template-columns: 1fr; }
      .ac-tab { padding: 6px 14px; font-size: 13px; }
    }
  </style></head><body>
  ${navHTML('academy')}
  
  <div class="ac-wrap">
    <div class="ac-label">학원 찾기</div>
    <h1 class="ac-title">전국 <em>학원 지점</em> 찾기</h1>
    <p class="ac-subtitle">내 주변 학원을 검색하고, 과목·위치 정보를 확인하세요.</p>
    <p class="ac-count">총 ${CENTERS.length}개 지점 운영 중</p>
    
    <div class="ac-search">
      <input type="text" id="acSearch" placeholder="지점명 또는 주소 검색" oninput="filterAcademy()">
      <button onclick="filterAcademy()">검색</button>
    </div>
    
    <div class="ac-tabs" id="acTabs">
      ${regionOrder.map((r, i) => '<div class="ac-tab' + (i === 0 ? ' active' : '') + '" onclick="filterByRegion(\'' + r + '\', this)">' + r + '</div>').join('')}
    </div>
    
    <div class="ac-grid" id="acGrid"></div>
  </div>
  
  <script>
    var allCenters = ${JSON.stringify(CENTERS)};
    var currentRegion = '전체';
    
    function renderCards(list) {
      var grid = document.getElementById('acGrid');
      if (list.length === 0) {
        grid.innerHTML = '<div class="ac-empty">검색 결과가 없습니다.</div>';
        return;
      }
      grid.innerHTML = list.map(function(c) {
        var subjects = (c.s || []).map(function(s) { return '<span class="ac-subj">' + s + '</span>'; }).join('');
        var schools = '';
        if (c.e) schools += '<b>초:</b> ' + c.e + ' ';
        if (c.m) schools += '<b>중:</b> ' + c.m + ' ';
        if (c.h) schools += '<b>고:</b> ' + c.h;
        return '<div class="ac-card">' +
          '<div class="ac-card-header"><div class="ac-card-name">' + c.n + '</div><div class="ac-card-region">' + c.r + '</div></div>' +
          '<div class="ac-card-addr">' + c.a + '</div>' +
          (c.l ? '<div class="ac-card-loc">' + c.l + '</div>' : '') +
          '<div class="ac-card-subjects">' + subjects + '</div>' +
          (schools ? '<div class="ac-card-schools">' + schools + '</div>' : '') +
          '</div>';
      }).join('');
    }
    
    function filterByRegion(region, el) {
      currentRegion = region;
      document.querySelectorAll('.ac-tab').forEach(function(t) { t.classList.remove('active'); });
      if (el) el.classList.add('active');
      document.getElementById('acSearch').value = '';
      filterAcademy();
    }
    
    function filterAcademy() {
      var query = document.getElementById('acSearch').value.toLowerCase();
      var list = allCenters.filter(function(c) {
        var regionOk = currentRegion === '전체' || c.r === currentRegion;
        var searchOk = !query || c.n.toLowerCase().indexOf(query) > -1 || c.a.toLowerCase().indexOf(query) > -1;
        return regionOk && searchOk;
      });
      renderCards(list);
    }
    
    filterAcademy();
  </script>
  
  ${footerHTML()}
  </body></html>`;
}

// --- Worker 메인 ---
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // robots.txt
    if (pathname === '/robots.txt') {
      return new Response(robotsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    
    // RSS 피드
    if (pathname === '/rss' || pathname === '/rss.xml' || pathname === '/feed') {
      return new Response(generateRSS(), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
    }
    
    // 사이트맵
    if (pathname === '/sitemap.xml') {
      const allUrls = getAllUrls();
      if (allUrls.length > 10000) {
        return new Response(generateSitemapIndex(allUrls.length), {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        });
      }
      return new Response(generateSitemap(), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }
    
    // 분할 사이트맵
    const sitemapMatch = pathname.match(/^\/sitemap-(\d+)\.xml$/);
    if (sitemapMatch) {
      const part = parseInt(sitemapMatch[1]);
      return new Response(generateSitemapPart(part), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }
    
    // 홈페이지
    if (pathname === '/' || pathname === '') {
      return new Response(renderHomepage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 카테고리: 지역별
    if (pathname === '/%EC%A7%80%EC%97%AD%EB%B3%84' || pathname === '/지역별') {
      return new Response(renderRegionList(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 카테고리: 특정 지역
    const regionMatch = decodeURIComponent(pathname).match(/^\/지역별\/(.+?)(?:\/(.+))?$/);
    if (regionMatch) {
      const region = regionMatch[1];
      if (REGIONS[region]) {
        const html = renderRegionDetail(region);
        if (html) return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    }
    
    // 카테고리: 과목별
    if (pathname === '/%EA%B3%BC%EB%AA%A9%EB%B3%84' || pathname === '/과목별') {
      return new Response(renderSubjectList(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // 카테고리: 학교급별
    if (pathname === '/%ED%95%99%EA%B5%90%EA%B8%89%EB%B3%84' || pathname === '/학교급별') {
      return new Response(renderLevelList(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    

    // 학원 전국지점
    const decodedPath = decodeURIComponent(pathname);
    if (decodedPath === '/학원' || decodedPath === '/학원/전국지점') {
      return new Response(renderAcademyList(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    // 콘텐츠 페이지
    const parsed = parseUrl(pathname);
    if (parsed) {
      const regionInfo = findRegion(parsed.location);
      if (regionInfo.valid) {
        const html = renderPage(parsed.location, parsed.level, parsed.subject, regionInfo.parentRegion, pathname);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          }
        });
      }
    }
    
    // 404
    return new Response(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>페이지를 찾을 수 없습니다 | 안하니</title></head><body style="font-family:sans-serif;text-align:center;padding:100px 20px;"><h1>404</h1><p>요청하신 페이지를 찾을 수 없습니다.</p><a href="/">홈으로 돌아가기</a></body></html>`, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};
