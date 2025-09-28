const asyncHandler = require("../middleware/asyncHandle");
const MyError = require("../utils/myError");
const paginate = require("../utils/paginate-sequelize");
exports.getOrganizationsRate = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const sort = req.query.sort;
    let select = req.query.select;

    ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
    const pagination = await paginate(page, limit, req.db.ratings);
    let query = { offset: pagination.start - 1, limit };
    if (req.query) {
        query.where = { ...req.query };
        query.include = [{ model: req.db.organization, as: "organization" }];
    }
    if (select) {
        query.attributes = select;
    }
    if (sort) {
        query.order = sort
            .split(" ")
            .map((el) => [
                el.charAt(0) === "-" ? el.substring(1) : el,
                el.charAt(0) === "-" ? "DESC" : "ASC",
            ]);
    }
    const ratings = await req.db.ratings.findAll({ ...query });
    res.status(200).json({
        message: "Success (:",
        body: {
            success: true,
            items: ratings,
            pagination,
        },
    });
}
);
exports.getOrganizationRate = asyncHandler(async (req, res, next) => {
    const { type } = req;
    let organizationId = type == "organization" ? req.userId : req.params.id;
    if (!type || !organizationId) {
        throw new MyError("Filter not found", 501);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const sort = req.query.sort;
    let select = req.query.select;

    if (select) {
        select = select.split(" ");
    }

    ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

    const pagination = await paginate(page, limit, req.db.ratings);

    let query = { offset: pagination.start - 1, limit };

    if (req.query) {

        query.where = { ...req.queryь, organizationId };
    }

    if (select) {
        query.attributes = select;
    }

    if (sort) {
        query.order = sort
            .split(" ")
            .map((el) => [
                el.charAt(0) === "-" ? el.substring(1) : el,
                el.charAt(0) === "-" ? "DESC" : "ASC",
            ]);
    }

    const ratings = await req.db.ratings.findAll(query);
    res.status(200).json({
        message: "Success (:",
        body: {
            success: true,
            items: ratings,
            pagination,
        },
    });
});
exports.ratingRemove = asyncHandler(async (req, res, next) => {
    const { type } = req;
    if (!type == "admin") {
        throw new MyError("Remove Filter not found", 501);
    }
    const { id } = req.params;
    if (!id) {
        throw new MyError("Filter not found", 501);
    }
    const rating = await req.db.ratings.findOne({ where: { id } });
    if (!rating) {
        throw new MyError("Rating not found", 404);
    }
    await rating.destroy();

    res.status(200).json({
        message: "Success (:",
        body: {
            success: true,
        },
    });
});
exports.createRatings = asyncHandler(async (req, res, next) => {
    const { organizationId } = req.body;
    if (!organizationId) {
        throw new MyError("Not Found Organization", 404);
    }
    // 1. Үнэлгээг хадгалах
    await req.db.ratings.create(req.body);

    // 2. Тухайн байгууллагын бүх үнэлгээг авч, дундаж ба нийт тооцоолох
    const ratings = await req.db.ratings.findAll({
        where: { organizationId },
        attributes: ["score"],
    });

    const totalRatings = ratings.length;
    const averageRating =
        totalRatings > 0
            ? ratings.reduce((acc, r) => acc + r.score, 0) / totalRatings
            : 0;

    // 3. Байгууллагын мэдээлэл шинэчлэх
    await req.db.organization.update(
        {
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalRatings,
        },
        {
            where: { id: organizationId },
        }
    );

    // 4. Хариу буцаах
    res.status(200).json({
        message: "Feedback амжилттай илгээгдлээ!",
        body: { success: true },
    });
});
