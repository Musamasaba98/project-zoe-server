import { Injectable, Logger, Inject } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { seedUsers } from "./data/users";
import seedGroups, { seedGroupCategories } from "./data/groups";
import { GroupCategoriesService } from "../groups/services/group-categories.service";
import { GroupsService } from "../groups/services/groups.service";
import { Repository, Connection } from "typeorm";
import EventCategory from "../events/entities/eventCategory.entity";
import eventCategories from "./data/eventCategories";
import GroupCategoryReport from "src/groups/entities/groupCategoryReport.entity";
import seedGroupReportCategories from "./data/groupCategoryReports";
import Roles from "src/users/entities/roles.entity";
import { roleAdmin } from "src/auth/constants";
import { ContactsService } from "src/crm/contacts.service";
import { JwtHelperService } from "src/auth/jwt-helpers.service";
import { GoogleService } from "src/vendor/google.service";
import { GroupPermissionsService } from "src/groups/services/group-permissions.service";

@Injectable()
export class SeedService {
  private eventCategoryRepository: Repository<EventCategory>;
  private gCatReportRepository: Repository<GroupCategoryReport>;
  private rolesRepository: Repository<Roles>;
  private usersService: UsersService;
  private groupsService: GroupsService;
  private groupCategoriesService: GroupCategoriesService;

  async createAll(
    connection: Connection,
    contactsService: ContactsService,
    jwtHelperservice: JwtHelperService,
    groupsPermissionsService: GroupPermissionsService,
    groupCategoriesService: GroupCategoriesService,
    googleService: GoogleService,
  ) {
    this.eventCategoryRepository = connection.getRepository(EventCategory);
    this.gCatReportRepository = connection.getRepository(GroupCategoryReport);
    this.rolesRepository = connection.getRepository(Roles);

    this.usersService = new UsersService(
      connection,
      contactsService,
      jwtHelperservice,
    );
    this.groupsService = new GroupsService(
      connection,
      groupsPermissionsService,
      googleService,
    );
    this.groupCategoriesService = groupCategoriesService;

    await this.createRoleAdmin();
    await this.createUsers();
    await this.createGroupCategories();
    await this.createEventCategories();
    await this.createGroups();
    await this.createGroupCategoryReports();
  }

  async createUsers() {
    Logger.log(`Seeding ${seedUsers.length} users`);
    for (const user of seedUsers) {
      const exists = await this.usersService.exists(user.email);
      if (exists) {
        Logger.log(`User: ${user.email} already exists`);
      } else {
        await this.usersService.register(user);
      }
    }
  }

  async createGroupCategories() {
    Logger.log(`Seeding ${seedGroupCategories.length} Group Categories`);
    for (const rec of seedGroupCategories) {
      const exists = await this.groupCategoriesService.exits(rec.id);
      if (exists) {
        Logger.debug(`Group Cat: ${rec.id} already exists`);
      } else {
        await this.groupCategoriesService.create(rec);
      }
    }
  }

  async createGroups() {
    Logger.log(`Seeding ${seedGroups.length} Groups`);
    const count = await this.groupsService.count();
    if (count > 0) {
      Logger.debug(`${count} Groups already exist`);
    } else {
      for (const rec of seedGroups) {
        await this.groupsService.create(rec, {}, true);
      }
    }
  }

  async createEventCategories() {
    Logger.log(`Seeding ${seedGroups.length} EventCategories`);
    const count = await this.eventCategoryRepository.count();
    if (count > 0) {
      Logger.debug(`${count} EventCategories already exist`);
    } else {
      for (const rec of eventCategories) {
        await this.eventCategoryRepository.save(rec);
      }
      Logger.debug(`${eventCategories.length} EventCategories created`);
    }
  }

  async createGroupCategoryReports() {
    Logger.log(
      `Seeding ${seedGroupReportCategories.length} GroupReportCategories`,
    );
    const count = await this.gCatReportRepository.count();
    if (count > 0) {
      Logger.debug(`${count} GroupReportCategories already exist`);
    } else {
      for (const rec of seedGroupReportCategories) {
        await this.gCatReportRepository.save(rec);
      }
      Logger.debug(
        `${seedGroupReportCategories.length} GroupReportCategories created`,
      );
    }
  }

  async createRoleAdmin() {
    const checkadminRole = await this.rolesRepository.find({
      where: { role: roleAdmin.role },
    });

    if (checkadminRole.length < 1) {
      Logger.debug(`Creating the ${roleAdmin.role} Role`);
      const toSave = new Roles();
      toSave.role = roleAdmin.role;
      toSave.description = roleAdmin.description;
      toSave.permissions = roleAdmin.permissions;
      toSave.isActive = roleAdmin.isActive;

      await this.rolesRepository.save(toSave);
    } else {
      Logger.debug(`${roleAdmin.role} Role already exist`);
    }
  }
}
