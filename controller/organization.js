const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate-sequelize");
const MyError = require("../utils/myError");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/email");
const { generateLengthPass, emailTemplate } = require("../utils/common");
exports.getOrganizations = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const sort = req.query.sort;
  let select = req.query.select;

  if (select) {
    select = select.split(" ");
    // ✅ Sensitive талбаруудаас цэвэрлэж байна
    select = select.filter(
      (field) =>
        !["password", "resetPasswordToken", "resetPasswordExpire"].includes(field)
    );
  }

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, req.db.organization);

  const query = {
    offset: pagination.start - 1,
    limit,
    where: req.query || {},
  };

  // ✅ Зөв attributes тохиргоо
  if (select && select.length > 0) {
    query.attributes = select;
  } else {
    query.attributes = {
      exclude: ["password", "resetPasswordToken", "resetPasswordExpire"],
    };
  }

  if (sort) {
    query.order = sort.split(" ").map((el) => [
      el.charAt(0) === "-" ? el.substring(1) : el,
      el.charAt(0) === "-" ? "DESC" : "ASC",
    ]);
  }

  const organizations = await req.db.organization.findAll(query);

  res.status(200).json({
    success: true,
    body: {
      items: organizations,
      pagination
    }
  });
});

exports.getOrganization = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await req.db.organization.findOne({
    where: {
      id
    }
  })
  if (!user) {
    throw new MyError("Та бүртгэлтэй эсэхээ шалгана уу", 401)
  }
  res.status(200).json({
    message: "Success (:",
    body: user,
  });
});
exports.signUp = asyncHandler(async (req, res, next) => {
  const { type, userId } = req;

  if (type != "user") {
    throw new MyError("Та бүртгэх эрхгүй байна", 501)
  }
  const user = await req.db.organization.create({ ...req.body, userId });
  if (!user) {
    throw new MyError("Бүртгэж чадсангүй");
  }
  const smtp = await req.db.email.findOne({
    where: {
      is_active: true
    }
  })

  await sendEmail({
    subject: "Шинэ бүртгэл үүслээ",
    email: req.body.email,
    message: emailTemplate({ title: "амжилттай бүртгүүллээ. 🎉" }),
    isHtml: true,
    smtp_username: smtp ? smtp.username : process.env.SMTP_USERNAME,
    smtp_password: smtp ? smtp.password : process.env.SMTP_PASSWORD,

  });
  res.status(200).json({
    message: "",
    body: { token: user.getJsonWebToken(), user: user },
  });
});

exports.signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new MyError("Имейл эсвэл нууц үгээ оруулна уу", 400);
  }
  const user = await req.db.organization.findOne({
    where: { email },
  });
  if (!user) {
    throw new MyError("Таны нэвтрэх нэр эсхүл нууц үг буруу байна", 400);
  }

  const ok = await user.CheckPass(password);
  if (!ok) {
    throw new MyError("Таны нэвтрэх нэр эсхүл нууц үг буруу байна", 400);
  }
  res.status(200).json({
    message: "",
    body: { token: user.getJsonWebToken(), user: user },
  });
});

exports.organizationInfo = asyncHandler(async (req, res, next) => {
  const { userId } = req;

  const user = await req.db.organization.findOne({
    where: {
      id: userId
    }
  })
  if (!user) {
    throw new MyError("Та бүртгэлтэй эсэхээ шалгана уу", 401)
  }
  res.status(200).json({
    message: "Success (:",
    body: user,
  });
});

exports.updateOrganizationInfo = asyncHandler(async (req, res, next) => {
  const { userId, type } = req;
  const { id: paramsId } = req.params;
  await req.db.organization.update(
    req.body,
    { where: { id: type == "user" ? paramsId : userId }, fields: { exclude: ['password'] } }
  );

  const org = await req.db.organization.findByPk(paramsId || userId);

  const smtp = await req.db.email.findOne({
    where: {
      is_active: true
    }
  })

  await sendEmail({
    subject: "Таны мэдээлэл шинэчлэгдлээ",
    email: org.email,
    message: emailTemplate({
      title: "Амжилттай шинэчиллээ", label: `<p>Хэрэв та өөрчлөлт оруулаагүй бол доорх холбоосоор нэвтэрч нууц үгээ сольж болно.</p>`
    }),

    isHtml: true,
    smtp_username: smtp ? smtp.username : process.env.SMTP_USERNAME,
    smtp_password: smtp ? smtp.password : process.env.SMTP_PASSWORD,

  });
  res.status(200).json({
    message: "User updated.",
    body: { success: true },
  });
})

exports.removeOrganization = asyncHandler(async (req, res, next) => {
  const { type } = req
  if (type != "user") {
    throw new MyError("Та бүртгэх эрхгүй байна", 501)
  }
  const userId = req.params.id;
  const organization = await req.db.organization.findByPk(userId);
  if (!organization) {
    throw new MyError(`Таны устгах гэсэн ${userId} дугаартай байгууллагын мэдээлэл олдсонгүй`, 404)
  }
  await organization.destroy();

  res.status(200).json({
    message: "Organization Deleted",
    body: { success: true },
  });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const password = generateLengthPass(8)
  if (!email) {
    throw new MyError(`Бүртгэлгүй байна!`, 400);
  }
  const users = await req.db.organization.findOne({
    where: {
      email,
    },
  });
  if (!users) {
    throw new MyError(`${email} байгууллага олдсонгүй!`, 400);
  }
  const salt = await bcrypt.genSalt(10);
  const new_password = await bcrypt.hash(password, salt);

  const smtp = await req.db.email.findOne({
    where: {
      is_active: true
    }
  })
  await sendEmail({
    subject: "Нууц үг солигдлоо үүслээ",
    email: req.body.email,
    message: emailTemplate({
      title: "Таны нууц үгээ сэргээлээ. 🎉", label: ` <p><strong>Нууц үг:</strong> ${password}</p>
              <p>Өдрийг сайхан өнгөрүүлээрэй! ☀️</p>`}),
    isHtml: true,
    smtp_username: smtp ? smtp.username : process.env.SMTP_USERNAME,
    smtp_password: smtp ? smtp.password : process.env.SMTP_PASSWORD,

  });
  await req.db.organization.update(
    { password: new_password },
    {
      where: {
        email,
      },
    }
  );
  res.status(200).json({
    message: "Таны нууц үг амжилттай сэргээгдлээ. Та бүртгэлтэй имейл хаягаараа нууц үгээ авна уу.",
    body: { success: true },
  });
});

exports.changePassword = asyncHandler(async (req, res, next) => {
  const id = req.userId;
  if (!id) {
    throw new MyError("Id олдсонгүй!", 400);
  }
  const new_password = req.body.password;
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(new_password, salt);
  await req.db.organization.update(
    { password },
    {
      where: {
        id,
      },
    }
  );

  const smtp = await req.db.email.findOne({
    where: {
      is_active: true
    }
  })

  await sendEmail({
    subject: "Таны нууц үг амжилттай шинэчлэгдлээ",
    email: req.email,
    message: emailTemplate({
      title: "Таны нууц үгээ шинэчлэгдлээ. 🎉"
    }),
    isHtml: true,
    smtp_username: smtp ? smtp.username : process.env.SMTP_USERNAME,
    smtp_password: smtp ? smtp.password : process.env.SMTP_PASSWORD,

  });
  res.status(200).json({
    message: "Таны нууц үг амжилттай шинэчлэгдлээ",
    body: { success: true },
  });
});